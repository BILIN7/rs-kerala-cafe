const mongoose = require('mongoose');
const Order = require('../models/Order');
const { getIO } = require('./socketService');

// In-memory accessor
const getInMemoryOrders = () => {
  try {
    const { inMemoryOrders } = require('../routes/orders');
    return inMemoryOrders;
  } catch (e) {
    return null;
  }
};

/**
 * Set prep time for an order (Solo Admin workflow)
 * @param {string} orderId 
 * @param {object} params { cookingMinutes, deliveryMinutes }
 */
async function setOrderPrepTime(orderId, { cookingMinutes = 20, deliveryMinutes = 15 }) {
  const cMins = Number(cookingMinutes) || 20;
  const dMins = Number(deliveryMinutes) || 15;
  const now = new Date();
  const readyTime = new Date(now.getTime() + cMins * 60 * 1000);
  const deliveredTime = new Date(readyTime.getTime() + dMins * 60 * 1000);

  let order = null;

  if (mongoose.connection.readyState === 1) {
    try {
      order = await Order.findById(orderId);
      if (order) {
        order.status = 'preparing';
        order.cookingStartedAt = now;
        order.estimatedCookingMinutes = cMins;
        order.estimatedPrepTime = cMins;
        order.estimatedReadyTime = readyTime;
        order.estimatedDeliveryMinutes = dMins;
        order.estimatedDeliveredTime = deliveredTime;
        order.autoProgression = true;
        order.statusHistory.push({
          status: 'preparing',
          timestamp: now,
          note: `Prep time set to ${cMins} mins (Ready ~ ${readyTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})`,
        });
        await order.save();
      }
    } catch (e) {
      console.error('Error saving order prep time to DB:', e.message);
    }
  }

  const inMemory = getInMemoryOrders();
  if (inMemory && (!order || !order._id)) {
    const memOrder = inMemory.get(orderId);
    if (memOrder) {
      memOrder.status = 'preparing';
      memOrder.cookingStartedAt = now;
      memOrder.estimatedCookingMinutes = cMins;
      memOrder.estimatedPrepTime = cMins;
      memOrder.estimatedReadyTime = readyTime;
      memOrder.estimatedDeliveryMinutes = dMins;
      memOrder.estimatedDeliveredTime = deliveredTime;
      memOrder.autoProgression = true;
      if (!memOrder.statusHistory) memOrder.statusHistory = [];
      memOrder.statusHistory.push({
        status: 'preparing',
        timestamp: now,
        note: `Prep time set to ${cMins} mins (Ready ~ ${readyTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})`,
      });
      order = memOrder;
    }
  }

  if (!order) {
    throw new Error('Order not found');
  }

  // Real-time broadcast
  const io = getIO();
  if (io) {
    const notifyMsg = `🍳 RS Kerala Cafe has accepted your order! Estimated cooking time: ${cMins} minutes.`;
    io.to(`order_${order._id}`).emit('orderUpdate', {
      status: 'preparing',
      notificationMessage: notifyMsg,
      order,
    });
    io.to('admin_room').emit('orderStatusChanged', {
      orderId: order._id,
      status: 'preparing',
      orderNumber: order.orderNumber,
      order,
    });
  }

  return order;
}

/**
 * Scan active orders and auto-advance status when timers expire
 */
async function processProgressionTick() {
  const nowMs = Date.now();
  const inMemory = getInMemoryOrders();
  const io = getIO();

  // Helper to process a single order object
  const evaluateOrder = async (order, saveFn) => {
    // Only auto-advance if autoProgression is enabled (defaults to true)
    if (order.autoProgression === false) return;
    if (order.status !== 'preparing' && order.status !== 'out_for_delivery' && order.status !== 'ready') return;

    let hasChanged = false;
    let newStatus = order.status;
    let note = '';
    let notificationMessage = '';

    const readyMs = order.estimatedReadyTime ? new Date(order.estimatedReadyTime).getTime() : null;
    const deliveredMs = order.estimatedDeliveredTime ? new Date(order.estimatedDeliveredTime).getTime() : null;

    // Check 1: 'preparing' -> 'ready' (collection) OR 'out_for_delivery' (delivery)
    if (order.status === 'preparing' && readyMs && nowMs >= readyMs) {
      if (order.fulfillmentType === 'collection') {
        newStatus = 'ready';
        note = `Cooking completed! Parcel ready for collection at counter (PIN: ${order.collectionPin || '----'})`;
        notificationMessage = `🛍️ Your order is ready for pickup! Show PIN ${order.collectionPin || ''} at the RS Kerala Cafe counter.`;
      } else {
        newStatus = 'out_for_delivery';
        note = `Cooking completed! Dispatched out for delivery. Estimated arrival ~ ${order.estimatedDeliveredTime ? new Date(order.estimatedDeliveredTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : 'soon'}`;
        notificationMessage = `🛵 Order is out for delivery! Driver is en route to your address.`;
      }
      hasChanged = true;
    }
    // Check 2: 'out_for_delivery' -> 'delivered'
    else if (order.status === 'out_for_delivery' && deliveredMs && nowMs >= deliveredMs) {
      newStatus = 'delivered';
      note = 'Delivery journey completed automatically.';
      notificationMessage = '🎉 Your RS Kerala Cafe meal has arrived! Thank you for ordering with us.';
      hasChanged = true;
    }
    // Check 3: 'ready' (collection) auto-marks delivered if past deliveredMs (e.g. 15-20 min collection pickup window)
    else if (order.status === 'ready' && order.fulfillmentType === 'collection' && deliveredMs && nowMs >= deliveredMs) {
      newStatus = 'delivered';
      note = 'Collection window completed - marked delivered.';
      notificationMessage = '🎉 Order marked as delivered/collected. Enjoy your meal!';
      hasChanged = true;
    }

    if (hasChanged) {
      order.status = newStatus;
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status: newStatus,
        timestamp: new Date(),
        note,
      });

      if (saveFn) {
        try {
          await saveFn(order);
        } catch (e) {
          console.error('Failed to persist order transition:', e.message);
        }
      }

      console.log(`⏱️ Auto-Progressed Order ${order.orderNumber || order._id} ➔ ${newStatus}`);

      if (io) {
        io.to(`order_${order._id}`).emit('orderUpdate', {
          status: newStatus,
          notificationMessage,
          order,
        });
        io.to('admin_room').emit('orderStatusChanged', {
          orderId: order._id,
          status: newStatus,
          orderNumber: order.orderNumber,
          order,
        });
      }
    }
  };

  // 1. Process in-memory orders
  if (inMemory) {
    for (const order of inMemory.values()) {
      await evaluateOrder(order, null);
    }
  }

  // 2. Process MongoDB orders if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const activeOrders = await Order.find({
        status: { $in: ['preparing', 'out_for_delivery', 'ready'] },
        autoProgression: { $ne: false },
      });
      for (const order of activeOrders) {
        await evaluateOrder(order, async (o) => await o.save());
      }
    } catch (e) {
      // Ignore DB polling errors
    }
  }
}

/**
 * Auto-clear orders older than specified days (default: 7 days)
 * Targets cancelled, failed, or completed orders
 */
async function autoPurgeOldOrders(days = 7, onlyCancelledOrFailed = false) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  let purgedCount = 0;

  // 1. Purge from MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      const condition = onlyCancelledOrFailed
        ? {
            $or: [
              { status: 'cancelled', createdAt: { $lt: cutoff } },
              { paymentStatus: 'failed', createdAt: { $lt: cutoff } },
            ],
          }
        : {
            $or: [
              { status: 'cancelled', createdAt: { $lt: cutoff } },
              { paymentStatus: 'failed', createdAt: { $lt: cutoff } },
              { status: { $in: ['delivered', 'collected'] }, createdAt: { $lt: cutoff } },
            ],
          };
      const res = await Order.deleteMany(condition);
      purgedCount += res.deletedCount || 0;
    } catch (e) {
      console.error('Error auto-purging old orders from DB:', e.message);
    }
  }

  // 2. Purge from inMemoryOrders
  const inMemory = getInMemoryOrders();
  if (inMemory) {
    for (const [id, order] of inMemory.entries()) {
      const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
      const isOld = orderDate < cutoff;
      const isEligible = onlyCancelledOrFailed
        ? (order.status === 'cancelled' || order.paymentStatus === 'failed')
        : (order.status === 'cancelled' || order.paymentStatus === 'failed' || order.status === 'delivered' || order.status === 'collected');

      if (isOld && isEligible) {
        inMemory.delete(id);
        purgedCount++;
      }
    }
  }

  if (purgedCount > 0) {
    console.log(`🧹 Auto-purged ${purgedCount} orders older than ${days} days.`);
  }

  return purgedCount;
}

let progressionInterval = null;
let purgeInterval = null;

/**
 * Start the background progression ticker (runs every 5 seconds)
 * And periodic auto-purge of old orders (runs every hour)
 */
function initOrderProgressionEngine() {
  if (progressionInterval) {
    clearInterval(progressionInterval);
  }
  progressionInterval = setInterval(processProgressionTick, 5000);
  console.log('⚡ Solo-Admin Order Progression Engine initialized (interval: 5s)');

  // Run initial auto-purge on startup and every hour
  autoPurgeOldOrders(7).catch(() => {});
  if (purgeInterval) {
    clearInterval(purgeInterval);
  }
  purgeInterval = setInterval(() => {
    autoPurgeOldOrders(7).catch(() => {});
  }, 60 * 60 * 1000); // 1 hour
}

module.exports = {
  setOrderPrepTime,
  initOrderProgressionEngine,
  processProgressionTick,
  autoPurgeOldOrders,
};
