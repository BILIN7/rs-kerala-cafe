const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// In-memory user store for instant fallback reliability
const inMemoryUsers = new Map();

/**
 * Pre-seed demo customer user
 */
async function initDefaultUsers() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const demoUser = {
    _id: '655920000000000000000001',
    name: 'Rahul Nair',
    email: 'customer@example.com',
    password: hashedPassword,
    phone: '07700 900123',
    role: 'customer',
    isActive: true,
    emailVerified: true,
    marketingOptIn: true,
    addresses: [
      {
        _id: '655920000000000000000002',
        label: 'Home',
        line1: '15 Palatine Road',
        line2: 'Northenden',
        city: 'Manchester',
        postcode: 'M22 4HH',
        gateCode: '#102',
        isDefault: true,
        coordinates: { lat: 53.4072, lng: -2.2519 },
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  inMemoryUsers.set(demoUser.email.toLowerCase(), demoUser);
  inMemoryUsers.set(demoUser._id, demoUser);

  // If MongoDB connected, sync demo user
  if (mongoose.connection.readyState === 1) {
    try {
      await User.findByIdAndUpdate(demoUser._id, demoUser, { upsert: true });
    } catch (e) {}
  }
}

// Initialize seed
initDefaultUsers().catch(console.error);

/**
 * Find user by email (lowercased)
 */
async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findOne({ email: cleanEmail });
      if (user) return user;
    } catch (e) {}
  }

  return inMemoryUsers.get(cleanEmail) || null;
}

/**
 * Find user by ID
 */
async function findUserById(id) {
  if (!id) return null;
  const strId = id.toString();

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findById(strId).select('-password');
      if (user) return user;
    } catch (e) {}
  }

  const u = inMemoryUsers.get(strId);
  if (u) {
    const { password, ...clean } = u;
    return clean;
  }
  return null;
}

/**
 * Create a new user
 */
async function createUser({ name, email, password, phone, marketingOptIn }) {
  const cleanEmail = email.trim().toLowerCase();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newId = new mongoose.Types.ObjectId().toString();

  const userObj = {
    _id: newId,
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    phone: phone ? phone.trim() : '',
    role: 'customer',
    isActive: true,
    emailVerified: false,
    marketingOptIn: !!marketingOptIn,
    addresses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Always store in inMemoryUsers for zero-failure fallback
  inMemoryUsers.set(cleanEmail, userObj);
  inMemoryUsers.set(newId, userObj);

  // Also persist to MongoDB if ready
  if (mongoose.connection.readyState === 1) {
    try {
      const dbUser = await User.create({
        _id: newId,
        name: userObj.name,
        email: cleanEmail,
        password, // User schema pre-save hook will hash
        phone: userObj.phone,
        marketingOptIn: userObj.marketingOptIn,
      });
      return { _id: dbUser._id, name: dbUser.name, email: dbUser.email, phone: dbUser.phone, role: dbUser.role, addresses: dbUser.addresses || [] };
    } catch (e) {
      console.warn('MongoDB user create fallback:', e.message);
    }
  }

  const { password: _, ...cleanUser } = userObj;
  return cleanUser;
}

/**
 * Match user password
 */
async function matchPassword(user, enteredPassword) {
  if (!user || !user.password) return false;
  return await bcrypt.compare(enteredPassword, user.password);
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  matchPassword,
  inMemoryUsers,
};
