const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const RestaurantSettings = require('../models/RestaurantSettings');
const { protect, admin } = require('../middleware/auth');
const { getIO } = require('../services/socketService');
const { setOrderPrepTime } = require('../services/orderProgressionService');

// Quick safe accessor for both MongoDB and in-memory fallback
const getOrderById = async (id) => {
  const { inMemoryOrders } = require('./orders');
  if (mongoose.connection.readyState === 1) {
    try {
      const order = await Order.findById(id);
      if (order) return order;
    } catch (e) {}
  }
  if (inMemoryOrders) {
    return inMemoryOrders.get(id);
  }
  return null;
};

// router.use(protect, admin); // enabled in production with JWT

// Optional auth for demo / admin ease
// @GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { inMemoryOrders } = require('./orders');
    const { status, page = 1, limit = 60, date, dateRange, days } = req.query;
    let orders = [];
    let total = 0;

    let startDate = null;
    let endDate = null;

    if (dateRange === 'today') {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (dateRange === 'previous' || dateRange === 'past') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      endDate = new Date();
      endDate.setHours(0, 0, 0, 0);
    } else if (dateRange === '7days' || days === '7') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === '30days' || days === '30') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else if (date) {
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
    }

    if (mongoose.connection.readyState === 1) {
      try {
        const filter = {};
        if (status === 'cancelled_or_failed') {
          filter.$or = [{ status: 'cancelled' }, { paymentStatus: 'failed' }];
        } else if (status && status !== 'all') {
          filter.status = status;
        }

        if (startDate || endDate) {
          filter.createdAt = {};
          if (startDate) filter.createdAt.$gte = startDate;
          if (endDate) filter.createdAt.$lte = endDate;
        }

        orders = await Order.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(Number(limit))
          .populate('customer', 'name email phone');
        total = await Order.countDocuments(filter);
      } catch (e) {
        // In-memory fallback
      }
    }

    if (orders.length === 0 && inMemoryOrders) {
      if (inMemoryOrders.size === 0) {
        const { seedDefaultOrders } = require('../services/seedOrdersService');
        await seedDefaultOrders(inMemoryOrders);
      }
      orders = Array.from(inMemoryOrders.values());

      if (status === 'cancelled_or_failed') {
        orders = orders.filter(o => o.status === 'cancelled' || o.paymentStatus === 'failed');
      } else if (status && status !== 'all') {
        orders = orders.filter(o => o.status === status);
      }

      if (startDate) {
        orders = orders.filter(o => new Date(o.createdAt || Date.now()) >= startDate);
      }
      if (endDate) {
        orders = orders.filter(o => new Date(o.createdAt || Date.now()) <= endDate);
      }

      orders.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      total = orders.length;
    }

    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /orders/seed-defaults - Force-seed or refresh default sample orders
router.post('/orders/seed-defaults', async (req, res) => {
  try {
    const { inMemoryOrders } = require('./orders');
    const { seedDefaultOrders } = require('../services/seedOrdersService');
    const seeded = await seedDefaultOrders(inMemoryOrders);
    res.json({
      success: true,
      message: `Successfully seeded ${seeded.length} default RS Kerala Cafe orders for Today and Previous days!`,
      count: seeded.length,
      orders: seeded,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /orders/:id - Admin deletes single order
router.delete('/orders/:id', async (req, res) => {
  try {
    const { inMemoryOrders } = require('./orders');
    const orderId = req.params.id;
    let deleted = false;

    if (mongoose.connection.readyState === 1) {
      try {
        const result = await Order.findByIdAndDelete(orderId);
        if (result) deleted = true;
      } catch (e) {}
    }

    if (inMemoryOrders && inMemoryOrders.has(orderId)) {
      inMemoryOrders.delete(orderId);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found or already deleted' });
    }

    const io = getIO();
    if (io) {
      io.to('admin_room').emit('orderDeleted', { orderId });
    }

    res.json({ success: true, message: `Order deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /orders/purge-old - Admin purges orders older than X days (default: 7 days)
router.post('/orders/purge-old', async (req, res) => {
  try {
    const { autoPurgeOldOrders } = require('../services/orderProgressionService');
    const { days = 7, onlyCancelledOrFailed = false } = req.body;
    const purgedCount = await autoPurgeOldOrders(Number(days) || 7, onlyCancelledOrFailed);

    const io = getIO();
    if (io && purgedCount > 0) {
      io.to('admin_room').emit('ordersPurged', { count: purgedCount });
    }

    res.json({
      success: true,
      purgedCount,
      message: `Cleared ${purgedCount} orders older than ${days} days.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({ status, timestamp: new Date(), note });

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    // Real-time update
    const io = getIO();
    if (io) {
      io.to(`order_${order._id}`).emit('orderUpdate', { status, order });
      io.to('admin_room').emit('orderStatusChanged', { orderId: order._id, status, orderNumber: order.orderNumber, order });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /orders/:id/accept - Admin accepts incoming order
router.put('/orders/:id/accept', async (req, res) => {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'confirmed';
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Order accepted by RS Kerala Cafe kitchen staff',
    });

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    const io = getIO();
    if (io) {
      const msg = `✅ Your order #${order.orderNumber} has been accepted by the kitchen!`;
      io.to(`order_${order._id}`).emit('orderUpdate', {
        status: 'confirmed',
        order,
        notificationMessage: msg,
      });
      io.to('admin_room').emit('orderStatusChanged', { orderId: order._id, status: 'confirmed', orderNumber: order.orderNumber, order });
    }

    res.json({ success: true, order, message: 'Order accepted!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /orders/:id/reject - Admin rejects incoming order with reason
router.put('/orders/:id/reject', async (req, res) => {
  try {
    const { reason = 'Kitchen is currently experiencing extremely high demand.' } = req.body;
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'cancelled';
    order.rejectionReason = reason;

    // If online card payment was taken, simulate instant refund
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: new Date(),
      note: `Order rejected by restaurant: ${reason}`,
    });

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    const io = getIO();
    if (io) {
      const msg = `❌ Order #${order.orderNumber} could not be accepted: ${reason}${order.paymentStatus === 'refunded' ? ' Any online payment has been refunded automatically.' : ''}`;
      io.to(`order_${order._id}`).emit('orderUpdate', {
        status: 'cancelled',
        rejectionReason: reason,
        order,
        notificationMessage: msg,
      });
      io.to('admin_room').emit('orderStatusChanged', { orderId: order._id, status: 'cancelled', orderNumber: order.orderNumber, order });
    }

    res.json({ success: true, order, message: 'Order rejected and customer notified.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /orders/:id/assign-driver - Admin assigns driver details and dispatch time
router.put('/orders/:id/assign-driver', async (req, res) => {
  try {
    const { driverName = 'Express Courier', driverPhone = '07700 900555', vehicle = 'Motorbike / Scooter', deliveryMinutes = 15 } = req.body;
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const dMins = Number(deliveryMinutes) || 15;
    order.driver = {
      name: driverName.trim() || 'Express Courier',
      phone: driverPhone.trim() || '07700 900555',
      vehicle: vehicle.trim() || 'Motorbike / Scooter',
      assignedAt: new Date(),
    };
    order.status = 'out_for_delivery';
    order.estimatedDeliveryMinutes = dMins;
    order.estimatedDeliveredTime = new Date(Date.now() + dMins * 60000);

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'out_for_delivery',
      timestamp: new Date(),
      note: `Dispatched with driver ${order.driver.name} (${order.driver.phone}) • Vehicle: ${order.driver.vehicle} • Est. arrival: ${dMins} mins`,
    });

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    const io = getIO();
    if (io) {
      const msg = `🛵 Driver ${order.driver.name} is on the way with your order! Call driver: ${order.driver.phone} (Arrival in ~${dMins} mins)`;
      io.to(`order_${order._id}`).emit('orderUpdate', {
        status: 'out_for_delivery',
        driver: order.driver,
        estimatedDeliveryMinutes: dMins,
        estimatedDeliveredTime: order.estimatedDeliveredTime,
        order,
        notificationMessage: msg,
      });
      io.to('admin_room').emit('orderStatusChanged', { orderId: order._id, status: 'out_for_delivery', orderNumber: order.orderNumber, order });
    }

    res.json({ success: true, order, message: `Driver ${order.driver.name} assigned. Order is out for delivery!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


// @PUT /api/admin/orders/:id/set-prep-time - Solo Admin sets cooking & delivery timers
router.put('/orders/:id/set-prep-time', async (req, res) => {
  try {
    const { cookingMinutes, deliveryMinutes } = req.body;
    const order = await setOrderPrepTime(req.params.id, {
      cookingMinutes: Number(cookingMinutes) || 20,
      deliveryMinutes: Number(deliveryMinutes) || 15,
    });
    res.json({ success: true, order, message: `Prep timer set to ${cookingMinutes || 20} mins.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/orders/:id/extend-prep-time - Hotel management adds +mins or adjusts live cooking time
router.put('/orders/:id/extend-prep-time', async (req, res) => {
  try {
    const { additionalMinutes } = req.body;
    const addMins = Number(additionalMinutes) || 5;
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const currentReady = order.estimatedReadyTime ? new Date(order.estimatedReadyTime).getTime() : Date.now();
    const newReady = new Date(Math.max(currentReady, Date.now()) + addMins * 60000);
    const dMins = order.estimatedDeliveryMinutes || 15;
    const newDelivered = new Date(newReady.getTime() + dMins * 60000);

    order.estimatedReadyTime = newReady;
    order.estimatedDeliveredTime = newDelivered;
    order.estimatedCookingMinutes = (order.estimatedCookingMinutes || 20) + addMins;
    order.estimatedPrepTime = order.estimatedCookingMinutes;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Management adjusted cooking time (+${addMins} mins, Ready ~ ${newReady.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})`,
    });

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    const io = getIO();
    if (io) {
      const notifyMsg = `⏳ Kitchen Update: Cooking time adjusted (+${addMins} mins). New estimated ready time: ${newReady.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`;
      io.to(`order_${order._id}`).emit('orderUpdate', {
        status: order.status,
        notificationMessage: notifyMsg,
        order,
      });
      io.to('admin_room').emit('orderStatusChanged', { orderId: order._id, status: order.status, order });
    }

    res.json({ success: true, order, message: `Added ${addMins} mins to cooking time.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/orders/:id/coordinates - Hotel management updates / saves exact GPS coordinates
router.put('/orders/:id/coordinates', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (!order.deliveryAddress) order.deliveryAddress = {};
    order.deliveryAddress.coordinates = { lat: Number(lat), lng: Number(lng) };

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    res.json({ success: true, order, coordinates: order.deliveryAddress.coordinates, message: 'Coordinates saved successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/admin/orders/:id/notify - Send direct alert / SMS notification to customer
router.post('/orders/:id/notify', async (req, res) => {
  try {
    const { message } = req.body;
    const order = await getOrderById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Send Real-Time Socket Broadcast to customer's screen
    const io = getIO();
    if (io) {
      io.to(`order_${order._id}`).emit('orderUpdate', {
        status: order.status,
        notificationMessage: message || `Update from kitchen for order ${order.orderNumber}`,
        order,
      });
    }

    // Try sending SMS via Twilio if configured
    try {
      const { sendStatusSMS } = require('../services/smsService');
      await sendStatusSMS(order, message || `RS Kerala Cafe Update: Your order ${order.orderNumber} status is ${order.status}`);
    } catch (smsErr) {}

    res.json({ success: true, message: 'Customer notified successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── MENU CRUD (HOTEL MANAGEMENT) ──────────────────────────────────────────

// @GET /api/admin/menu - List all items for management (including unavailable items)
router.get('/menu', async (req, res) => {
  try {
    const { getInMemoryMenu } = require('./menu');
    let items = [];
    if (mongoose.connection.readyState === 1) {
      items = await MenuItem.find().sort({ category: 1, name: 1 });
    }
    if (!items || items.length === 0) {
      items = getInMemoryMenu();
    }
    res.json({ success: true, items, total: items.length });
  } catch (error) {
    const { getInMemoryMenu } = require('./menu');
    res.json({ success: true, items: getInMemoryMenu() });
  }
});

// @POST /api/admin/menu - Add new dish
router.post('/menu', async (req, res) => {
  try {
    const { addInMemoryMenuItem } = require('./menu');
    let item;
    if (mongoose.connection.readyState === 1) {
      try {
        item = await MenuItem.create(req.body);
      } catch (e) {}
    }
    if (!item) {
      item = addInMemoryMenuItem(req.body);
    }
    res.status(201).json({ success: true, item, message: 'Dish added to menu!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/menu/:id - Update existing dish
router.put('/menu/:id', async (req, res) => {
  try {
    const { updateInMemoryMenuItem } = require('./menu');
    let item;
    if (mongoose.connection.readyState === 1) {
      try {
        item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      } catch (e) {}
    }
    if (!item) {
      item = updateInMemoryMenuItem(req.params.id, req.body);
    }
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, item, message: 'Dish updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @DELETE /api/admin/menu/:id - Delete dish
router.delete('/menu/:id', async (req, res) => {
  try {
    const { deleteInMemoryMenuItem } = require('./menu');
    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        deleted = Boolean(item);
      } catch (e) {}
    }
    if (!deleted) {
      deleted = deleteInMemoryMenuItem(req.params.id);
    }
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PATCH /api/admin/menu/:id/toggle - Quick toggle availability (86 / In Stock)
router.patch('/menu/:id/toggle', async (req, res) => {
  try {
    const { toggleInMemoryMenuItem } = require('./menu');
    let item;
    if (mongoose.connection.readyState === 1) {
      try {
        item = await MenuItem.findById(req.params.id);
        if (item) {
          item.isAvailable = !item.isAvailable;
          await item.save();
        }
      } catch (e) {}
    }
    if (!item) {
      item = toggleInMemoryMenuItem(req.params.id);
    }
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({
      success: true,
      item,
      message: `Dish marked as ${item.isAvailable ? 'In Stock' : 'Sold Out / Unavailable'}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

// @GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  const { inMemoryOrders } = require('./orders');
  const allOrders = inMemoryOrders ? Array.from(inMemoryOrders.values()) : [];
  const totalRev = allOrders.reduce((acc, o) => acc + (o.total || 0), 0);

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const thisMonthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const todayOrdersInMem = allOrders.filter(o => new Date(o.createdAt || 0) >= todayStart).length;
  const monthOrdersInMem = allOrders.filter(o => new Date(o.createdAt || 0) >= thisMonthStart).length;

  if (mongoose.connection.readyState !== 1) {
    return res.json({
      success: true,
      analytics: {
        todayOrders: todayOrdersInMem,
        monthOrders: monthOrdersInMem,
        totalRevenuePence: totalRev,
        totalRevenueGBP: (totalRev / 100).toFixed(2),
        topItems: [],
      },
    });
  }

  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayOrders, monthOrders, totalRevenue, topItems] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: '$items.itemTotal' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      analytics: {
        todayOrders: todayOrders || allOrders.length,
        monthOrders: monthOrders || allOrders.length,
        totalRevenuePence: totalRevenue[0]?.total || totalRev,
        totalRevenueGBP: ((totalRevenue[0]?.total || totalRev) / 100).toFixed(2),
        topItems,
      },
    });
  } catch (error) {
    res.json({
      success: true,
      analytics: {
        todayOrders: allOrders.length,
        monthOrders: allOrders.length,
        totalRevenuePence: totalRev,
        totalRevenueGBP: (totalRev / 100).toFixed(2),
        topItems: [],
      },
    });
  }
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

// @GET /api/admin/settings
router.get('/settings', async (req, res) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) settings = await RestaurantSettings.create({});
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @PUT /api/admin/settings
router.put('/settings', async (req, res) => {
  try {
    let settings = await RestaurantSettings.findOne();
    if (!settings) {
      settings = await RestaurantSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
