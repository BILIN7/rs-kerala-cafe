const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const {
  findUserByEmail,
  findUserById,
  createUser,
  matchPassword,
  inMemoryUsers,
} = require('../services/userService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'dev_secret_key_12345', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone')
      .optional()
      .customSanitizer((v) => (v ? v.replace(/\s+/g, '') : v))
      .matches(/^(\+44|0)[0-9]{10}$/)
      .withMessage('Valid UK phone number required (e.g., 07123456789)'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { name, email, password, phone, marketingOptIn } = req.body;
    try {
      const userExists = await findUserByEmail(email);
      if (userExists) {
        return res.status(400).json({ success: false, message: 'Email is already registered. Please login.' });
      }

      const user = await createUser({
        name,
        email,
        password,
        phone: phone ? phone.replace(/\s+/g, '') : '',
        marketingOptIn: marketingOptIn || false,
      });

      const token = generateToken(user._id);
      res.status(201).json({
        success: true,
        message: 'Account registered successfully! Welcome to RS Kerala Cafe.',
        token,
        user,
      });
    } catch (error) {
      console.error('Register route error:', error);
      res.status(500).json({ success: false, message: error.message || 'Registration failed' });
    }
  }
);

// @POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg, errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await matchPassword(user, password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      if (user.isActive === false) {
        return res.status(401).json({ success: false, message: 'Account has been deactivated' });
      }

      const token = generateToken(user._id);
      const { password: _, ...cleanUser } = user;

      res.json({
        success: true,
        message: 'Login successful!',
        token,
        user: cleanUser,
      });
    } catch (error) {
      console.error('Login route error:', error);
      res.status(500).json({ success: false, message: error.message || 'Login failed' });
    }
  }
);

// @GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, marketingOptIn } = req.body;
    const userId = req.user._id.toString();

    // In-memory update
    const memUser = inMemoryUsers.get(userId) || inMemoryUsers.get(req.user.email?.toLowerCase());
    if (memUser) {
      if (name) memUser.name = name.trim();
      if (phone) memUser.phone = phone.trim();
      if (marketingOptIn !== undefined) memUser.marketingOptIn = marketingOptIn;
      memUser.updatedAt = new Date();
    }

    // MongoDB update if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await User.findByIdAndUpdate(userId, { name, phone, marketingOptIn });
      } catch (e) {}
    }

    const updatedUser = await findUserById(userId);
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/auth/addresses - Add delivery address
router.post('/addresses', protect, async (req, res) => {
  try {
    const { label, line1, line2, city, postcode, gateCode, coordinates, isDefault } = req.body;
    const userId = req.user._id.toString();
    const newAddressId = new mongoose.Types.ObjectId().toString();

    const newAddress = {
      _id: newAddressId,
      label: label || 'Home',
      line1,
      line2,
      city: city || 'Manchester',
      postcode,
      gateCode,
      coordinates,
      isDefault: isDefault || false,
    };

    const memUser = inMemoryUsers.get(userId) || inMemoryUsers.get(req.user.email?.toLowerCase());
    if (memUser) {
      if (!memUser.addresses) memUser.addresses = [];
      if (isDefault) {
        memUser.addresses.forEach((a) => (a.isDefault = false));
      }
      memUser.addresses.push(newAddress);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findById(userId);
        if (user) {
          if (isDefault) user.addresses.forEach((a) => (a.isDefault = false));
          user.addresses.push(newAddress);
          await user.save();
        }
      } catch (e) {}
    }

    const updatedUser = await findUserById(userId);
    res.status(201).json({
      success: true,
      addresses: updatedUser?.addresses || [newAddress],
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/auth/addresses/:id
router.delete('/addresses/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const addressId = req.params.id;

    const memUser = inMemoryUsers.get(userId) || inMemoryUsers.get(req.user.email?.toLowerCase());
    if (memUser && memUser.addresses) {
      memUser.addresses = memUser.addresses.filter((a) => a._id?.toString() !== addressId);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.addresses = user.addresses.filter((a) => a._id?.toString() !== addressId);
          await user.save();
        }
      } catch (e) {}
    }

    const updatedUser = await findUserById(userId);
    res.json({
      success: true,
      addresses: updatedUser?.addresses || [],
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
