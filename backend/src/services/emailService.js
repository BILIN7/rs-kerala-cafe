const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const sendOrderConfirmationEmail = async (order) => {
  const customerEmail = order.guestEmail || (order.customer && order.customer.email);
  if (!customerEmail || !process.env.SENDGRID_API_KEY) return;

  const itemsList = order.items
    .map(i => `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">${i.name} x${i.quantity}</td><td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">£${(i.itemTotal / 100).toFixed(2)}</td></tr>`)
    .join('');

  const msg = {
    to: customerEmail,
    from: { email: process.env.FROM_EMAIL || 'orders@rskeralacafe.co.uk', name: process.env.FROM_NAME || process.env.RESTAURANT_NAME || 'RS Kerala Cafe' },
    subject: `Order Confirmed - ${order.orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h1 style="color: #059669; margin-top: 0;">Order Confirmed!</h1>
        <p>Thank you for choosing ${process.env.RESTAURANT_NAME || 'RS Kerala Cafe'}. Your order number is <strong>${order.orderNumber}</strong>.</p>
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #fdf8f0; text-align: left;"><th style="padding: 8px;">Item</th><th style="padding: 8px; text-align: right;">Price</th></tr>
          </thead>
          <tbody>${itemsList}</tbody>
          <tfoot>
            <tr><td style="padding: 8px;"><strong>Subtotal</strong></td><td style="padding: 8px; text-align: right;">£${(order.subtotal / 100).toFixed(2)}</td></tr>
            ${order.deliveryFee > 0 ? `<tr><td style="padding: 8px;">Delivery</td><td style="padding: 8px; text-align: right;">£${(order.deliveryFee / 100).toFixed(2)}</td></tr>` : ''}
            ${order.discount > 0 ? `<tr><td style="padding: 8px; color: green;">Discount</td><td style="padding: 8px; text-align: right; color: green;">-£${(order.discount / 100).toFixed(2)}</td></tr>` : ''}
            <tr><td style="padding: 8px; font-size: 1.1em;"><strong>Total</strong></td><td style="padding: 8px; text-align: right; font-size: 1.1em; color: #e85d04;"><strong>£${(order.total / 100).toFixed(2)}</strong></td></tr>
          </tfoot>
        </table>
        <p style="margin-top: 20px;">Fulfillment: <strong>${order.fulfillmentType === 'delivery' ? 'Delivery' : 'Collection'}</strong></p>
        ${order.fulfillmentType === 'delivery' && order.deliveryAddress ? `<p>Delivery Address: ${order.deliveryAddress.line1}, ${order.deliveryAddress.city || ''} ${order.deliveryAddress.postcode}</p>` : ''}
        <p style="margin-top: 25px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/order/${order._id}/track" style="background:#e85d04; color:white; padding:12px 24px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">Track Your Order</a></p>
      </div>
    `,
  };

  await sgMail.send(msg);
};

const sendAdminNewOrderEmail = async (order) => {
  if (!process.env.RESTAURANT_EMAIL || !process.env.SENDGRID_API_KEY) return;
  const msg = {
    to: process.env.RESTAURANT_EMAIL,
    from: { email: process.env.FROM_EMAIL || 'orders@tastyoven.co.uk', name: 'Order Notification' },
    subject: `New Order: ${order.orderNumber} - £${(order.total / 100).toFixed(2)}`,
    html: `
      <h2>New Order Received: ${order.orderNumber}</h2>
      <p>Total: <strong>£${(order.total / 100).toFixed(2)}</strong></p>
      <p>Type: <strong>${order.fulfillmentType}</strong></p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin">Go to Admin Dashboard</a></p>
    `,
  };
  await sgMail.send(msg);
};

module.exports = { sendOrderConfirmationEmail, sendAdminNewOrderEmail };
