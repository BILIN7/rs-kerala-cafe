const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, admin, optionalAuth } = require('../middleware/auth');

// @POST /api/coupons/validate
router.post('/validate', optionalAuth, async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required' });

    let coupon;
    try {
      coupon = await Coupon.findOne({ code: code.toUpperCase() });
    } catch (e) {
      // In-memory fallback
    }

    if (!coupon && code.toUpperCase() === 'WELCOME10') {
      const discount = Math.round(orderTotal * 0.1);
      return res.json({
        success: true,
        coupon: {
          code: 'WELCOME10',
          description: '10% off your order',
          discountType: 'percentage',
          discountValue: 10,
        },
        discount,
      });
    }

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const validity = coupon.isValid(orderTotal);
    if (!validity.valid) return res.status(400).json({ success: false, message: validity.reason });

    const discount = coupon.calculateDiscount(orderTotal);
    res.json({ success: true, coupon: { code: coupon.code, description: coupon.description, discountType: coupon.discountType, discountValue: coupon.discountValue }, discount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Admin coupon management
router.get('/', protect, admin, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', protect, admin, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
