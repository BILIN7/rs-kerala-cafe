const twilio = require('twilio');

const sendOrderSMS = async (order) => {
  const phone = order.guestPhone || (order.customer && order.customer.phone);
  if (!phone || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return;

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const estimatedTime = order.fulfillmentType === 'delivery' ? '45 minutes' : '20 minutes';

  await client.messages.create({
    body: `Your order ${order.orderNumber} is confirmed! Estimated ${order.fulfillmentType}: ${estimatedTime}. Track: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order._id}/track`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

const sendStatusSMS = async (order, message) => {
  const phone = order.guestPhone || (order.customer && order.customer.phone);
  if (!phone || !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: phone });
};

module.exports = { sendOrderSMS, sendStatusSMS };
