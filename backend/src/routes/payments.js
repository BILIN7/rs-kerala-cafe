const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Order = require('../models/Order');
const { optionalAuth } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { sendOrderSMS } = require('../services/smsService');
const { getIO } = require('../services/socketService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── SIMULATION / DEMO MODE PAYMENT ──────────────────────────────────────────

// @POST /api/payments/simulate - Instant Simulation / Demo Mode Payment
router.post('/simulate', optionalAuth, async (req, res) => {
  try {
    const { orderId, paymentMethod = 'stripe', paymentReference } = req.body;
    const mongoose = require('mongoose');
    const { inMemoryOrders } = require('./orders');
    let order;

    if (mongoose.connection.readyState === 1) {
      try {
        order = await Order.findById(orderId);
      } catch (e) {}
    }
    if (!order && inMemoryOrders) {
      order = inMemoryOrders.get(orderId);
    }

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const isCash = paymentMethod === 'cash';
    const ref = paymentReference || `SIM-GBP-${Math.floor(100000 + Math.random() * 900000)}`;

    order.paymentMethod = paymentMethod;
    order.paymentStatus = isCash ? 'pending' : 'paid';
    order.paymentIntentId = isCash ? `CASH-${order.orderNumber}` : ref;
    order.paymentReference = isCash ? `CASH-ON-HANDOVER` : ref;
    order.status = 'confirmed';

    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: isCash
        ? `Order confirmed: Pay on Handover (Cash £${(order.total / 100).toFixed(2)} to be collected upon arrival)`
        : `Payment authorized via Simulation Mode (${paymentMethod.toUpperCase()} • Ref: ${ref})`,
    });

    if (mongoose.connection.readyState === 1 && typeof order.save === 'function') {
      await order.save();
    }

    // Trigger all actions across the system!
    const io = getIO();
    if (io) {
      // 1. Alert customer tracking
      io.to(`order_${order._id}`).emit('orderUpdate', {
        status: 'confirmed',
        notificationMessage: `✅ Payment authorized! Kitchen received your order ticket.`,
        order,
      });

      // 2. Alert hotel management admin dashboard (plays bell sound & pops up alert modal)
      io.to('admin_room').emit('newOrder', { order });
      io.to('admin_room').emit('orderStatusChanged', {
        orderId: order._id,
        status: 'confirmed',
        orderNumber: order.orderNumber,
        order,
      });
    }

    res.json({
      success: true,
      message: 'Simulated payment successful! Order dispatched to kitchen.',
      order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── STRIPE ───────────────────────────────────────────────────────────────────

// @POST /api/payments/stripe/create-intent
router.post('/stripe/create-intent', optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.total,
      currency: 'gbp',
      metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber },
      description: `Order ${order.orderNumber} - Food Ordering`,
      receipt_email: order.guestEmail || (order.customer ? undefined : undefined),
    });

    order.paymentIntentId = paymentIntent.id;
    order.paymentMethod = 'stripe';
    await order.save();

    res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/payments/stripe/webhook
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
    if (order) {
      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment received via Stripe' });
      await order.save();

      // Notify via socket
      const io = getIO();
      if (io) io.to(`order_${order._id}`).emit('orderUpdate', { status: 'confirmed', order });

      // Send notifications
      try { await sendOrderConfirmationEmail(order); } catch (e) { console.error('Email error:', e.message); }
      try { await sendOrderSMS(order); } catch (e) { console.error('SMS error:', e.message); }
    }
  }

  res.json({ received: true });
});

// ─── PAYPAL ───────────────────────────────────────────────────────────────────

// @POST /api/payments/paypal/create-order
router.post('/paypal/create-order', optionalAuth, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const totalGBP = (order.total / 100).toFixed(2);

    // PayPal API call (simplified - use @paypal/checkout-server-sdk in production)
    const paypalOrderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.orderNumber,
        description: `Food Order ${order.orderNumber}`,
        amount: { currency_code: 'GBP', value: totalGBP },
      }],
    };

    // In production, use the PayPal SDK to create the order
    // For now return the data structure
    res.json({ success: true, paypalOrderData, orderTotal: totalGBP });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/payments/paypal/capture
router.post('/paypal/capture', optionalAuth, async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // In production: capture via PayPal SDK
    order.paymentStatus = 'paid';
    order.paymentMethod = 'paypal';
    order.paymentReference = paypalOrderId;
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment received via PayPal' });
    await order.save();

    const io = getIO();
    if (io) io.to(`order_${order._id}`).emit('orderUpdate', { status: 'confirmed', order });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── SQUARE ───────────────────────────────────────────────────────────────────

// @POST /api/payments/square/create-payment
router.post('/square/create-payment', optionalAuth, async (req, res) => {
  try {
    const { orderId, sourceId, verificationToken } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const { Client, Environment } = require('square');
    const squareClient = new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
    });

    const { result } = await squareClient.paymentsApi.createPayment({
      sourceId,
      idempotencyKey: order._id.toString(),
      amountMoney: { amount: BigInt(order.total), currency: 'GBP' },
      locationId: process.env.SQUARE_LOCATION_ID,
      referenceId: order.orderNumber,
      verificationToken,
    });

    order.paymentStatus = 'paid';
    order.paymentMethod = 'square';
    order.paymentReference = result.payment.id;
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment received via Square' });
    await order.save();

    const io = getIO();
    if (io) io.to(`order_${order._id}`).emit('orderUpdate', { status: 'confirmed', order });

    res.json({ success: true, order, payment: result.payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── GOCARDLESS ───────────────────────────────────────────────────────────────

// @POST /api/payments/gocardless/create-mandate
router.post('/gocardless/create-mandate', optionalAuth, async (req, res) => {
  try {
    const { orderId, redirectFlowId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const GoCardlessClient = require('gocardless-nodejs');
    const constants = require('gocardless-nodejs/constants');

    const gcClient = GoCardlessClient(process.env.GOCARDLESS_ACCESS_TOKEN,
      process.env.GOCARDLESS_ENVIRONMENT === 'live' ? constants.Environments.Live : constants.Environments.Sandbox
    );

    // Create redirect flow for bank debit setup
    const redirectFlow = await gcClient.redirectFlows.create({
      description: `Order ${order.orderNumber}`,
      session_token: order._id.toString(),
      success_redirect_url: `${process.env.FRONTEND_URL}/order/${order._id}/confirmation`,
      prefilled_customer: {
        email: order.guestEmail,
      },
    });

    res.json({ success: true, redirectUrl: redirectFlow.redirect_url, redirectFlowId: redirectFlow.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @POST /api/payments/gocardless/complete
router.post('/gocardless/complete', optionalAuth, async (req, res) => {
  try {
    const { orderId, redirectFlowId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // In production: complete redirect flow and create payment via GoCardless SDK
    order.paymentStatus = 'paid';
    order.paymentMethod = 'gocardless';
    order.paymentReference = redirectFlowId;
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', timestamp: new Date(), note: 'Payment received via GoCardless bank debit' });
    await order.save();

    const io = getIO();
    if (io) io.to(`order_${order._id}`).emit('orderUpdate', { status: 'confirmed', order });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
