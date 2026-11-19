const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Coupon = require('../models/Coupon');
const RestaurantSettings = require('../models/RestaurantSettings');
const { protect, optionalAuth } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { sendOrderSMS } = require('../services/smsService');
const { getIO } = require('../services/socketService');

// In-memory orders cache for instant demo reliability
const inMemoryOrders = new Map();
const { seedDefaultOrders } = require('../services/seedOrdersService');

// Seed realistic Kerala Cafe orders for Today and Previous days
try {
  seedDefaultOrders(inMemoryOrders);
} catch (err) {
  console.warn('Initial seed error:', err.message);
}

// Helper: calculate order totals
const calculateOrderTotals = async (items, fulfillmentType, couponCode, settings) => {
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    let menuItem;
    try {
      if (mongoose.connection.readyState === 1) {
        menuItem = await MenuItem.findById(item.menuItemId);
      }
    } catch (e) {}

    // Fallback if not in MongoDB
    if (!menuItem) {
      const menuRoute = require('./menu');
      const fallbackList = menuRoute.DEFAULT_MENU || [];
      menuItem = fallbackList.find(i => i._id.toString() === (item.menuItemId || '').toString());
    }

    const price = menuItem ? menuItem.price : (item.price || 999);
    const name = menuItem ? menuItem.name : (item.name || 'Delicious Dish');
    const image = menuItem?.image || item.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80';
    const itemTotal = price * (item.quantity || 1);
    subtotal += itemTotal;

    orderItems.push({
      menuItem: menuItem ? menuItem._id : item.menuItemId,
      name,
      image,
      price,
      quantity: item.quantity || 1,
      selectedOptions: item.selectedOptions || [],
      itemTotal,
    });
  }

  let deliveryFee = fulfillmentType === 'delivery' ? (settings.deliveryFee || 199) : 0;
  if (fulfillmentType === 'delivery' && subtotal >= (settings.freeDeliveryThreshold || 3500)) {
    deliveryFee = 0;
  }

  let discount = 0;
  let coupon = null;
  if (couponCode) {
    if (couponCode.toUpperCase() === 'WELCOME10') {
      discount = Math.round(subtotal * 0.1);
    } else if (mongoose.connection.readyState === 1) {
      try {
        coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon && coupon.isValid(subtotal).valid) {
          discount = coupon.calculateDiscount(subtotal);
        }
      } catch (e) {}
    }
  }

  const total = subtotal + deliveryFee - discount;
  return { orderItems, subtotal, deliveryFee, discount, total, coupon };
};

// @POST /api/orders - Create order
router.post('/', optionalAuth, async (req, res) => {
  try {
    const settings = {
      deliveryFee: 199,
      freeDeliveryThreshold: 3500,
      minimumDeliveryOrder: 1500,
    };

    const {
      items,
      fulfillmentType,
      deliveryAddress,
      scheduledFor,
      couponCode,
      specialInstructions,
      guestEmail,
      guestPhone,
      guestName,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    const { orderItems, subtotal, deliveryFee, discount, total, coupon } =
      await calculateOrderTotals(items, fulfillmentType, couponCode, settings);

    // Generate 4-digit Handover PIN for BOTH Collection & Delivery verification
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    const collectionPin = generatedPin;
    const deliveryPin = generatedPin;
    const handoverPin = generatedPin;

    const date = new Date();
    const count = inMemoryOrders.size + 101;
    const orderNumber = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(count).padStart(4, '0')}`;

    let order;
    if (mongoose.connection.readyState === 1) {
      order = await Order.create({
        orderNumber,
        customer: req.user ? req.user._id : undefined,
        guestEmail: !req.user ? guestEmail : undefined,
        guestPhone: !req.user ? guestPhone : undefined,
        guestName: !req.user ? guestName : undefined,
        items: orderItems,
        fulfillmentType,
        deliveryAddress,
        collectionPin,
        deliveryPin,
        handoverPin,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        subtotal,
        deliveryFee,
        discount,
        total,
        coupon: coupon ? coupon._id : undefined,
        couponCode: couponCode || undefined,
        specialInstructions,
        paymentStatus: 'pending',
        status: 'pending',
        statusHistory: [{ status: 'pending', timestamp: new Date(), note: 'Order placed' }],
      });
    } else {
      // In-memory representation
      const mockId = new mongoose.Types.ObjectId().toString();
      order = {
        _id: mockId,
        orderNumber,
        customer: req.user ? { name: req.user.name, email: req.user.email, phone: req.user.phone } : undefined,
        guestEmail,
        guestPhone,
        guestName,
        items: orderItems,
        fulfillmentType,
        deliveryAddress,
        collectionPin,
        deliveryPin,
        handoverPin,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode,
        specialInstructions,
        paymentStatus: 'paid',
        status: 'confirmed',
        statusHistory: [
          { status: 'pending', timestamp: new Date(), note: 'Order placed' },
          { status: 'confirmed', timestamp: new Date(), note: 'Order confirmed' },
        ],
        createdAt: new Date(),
      };
      inMemoryOrders.set(mockId, order);
    }

    // Broadcast new order to Admin Dashboard
    const io = getIO();
    if (io) {
      io.to('admin_room').emit('newOrder', { order });
      io.to('admin_room').emit('orderStatusChanged', { orderId: order._id, status: order.status, orderNumber: order.orderNumber, order });
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/orders/my - Get current user's orders
router.get('/my', protect, async (req, res) => {
  try {
    let orders = [];
    if (mongoose.connection.readyState === 1) {
      orders = await Order.find({ customer: req.user._id }).sort({ createdAt: -1 }).limit(20);
    }
    if (orders.length === 0) {
      orders = Array.from(inMemoryOrders.values());
    }
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: true, orders: Array.from(inMemoryOrders.values()) });
  }
});

// @GET /api/orders/:id/track - Track order
router.get('/:id/track', async (req, res) => {
  try {
    let order;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = inMemoryOrders.get(req.params.id);
    }
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    const order = inMemoryOrders.get(req.params.id);
    if (order) return res.json({ success: true, order });
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/orders/:id/verify-pin - Verify 4-digit PIN for collection or delivery handover
router.post('/:id/verify-pin', async (req, res) => {
  try {
    const { pin } = req.body;
    let order;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = inMemoryOrders.get(req.params.id);
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const expectedPin = order.collectionPin || order.deliveryPin || order.handoverPin;
    if (expectedPin && expectedPin.toString() !== pin?.toString().trim()) {
      return res.status(400).json({ success: false, message: 'Invalid 4-digit verification code. Please check with customer.' });
    }

    const isCol = order.fulfillmentType === 'collection';
    const nextStatus = isCol ? 'collected' : 'delivered';

    order.status = nextStatus;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: nextStatus,
      timestamp: new Date(),
      note: isCol
        ? `Verified counter collection with 4-digit PIN: ${pin}`
        : `Verified doorstep delivery handover with 4-digit PIN: ${pin}`,
    });

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    const io = getIO();
    if (io) {
      io.to(`order_${order._id}`).emit('orderUpdate', { status: nextStatus, order });
      io.to('admin_room').emit('orderStatusChanged', { orderId: order._id, status: nextStatus });
    }

    res.json({
      success: true,
      message: isCol
        ? 'Collection code verified successfully! Order marked as collected.'
        : 'Doorstep handover verified! Order marked as delivered.',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @GET /api/orders/:id
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    let order;
    if (mongoose.connection.readyState === 1) {
      order = await Order.findById(req.params.id);
    }
    if (!order) {
      order = inMemoryOrders.get(req.params.id);
    }
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    const order = inMemoryOrders.get(req.params.id);
    if (order) return res.json({ success: true, order });
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.inMemoryOrders = inMemoryOrders;
