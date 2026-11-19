const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  image: String, // Dish thumbnail image
  price: { type: Number, required: true }, // in pence
  quantity: { type: Number, required: true, min: 1 },
  selectedOptions: [{
    groupName: String,
    selectedItems: [{ name: String, priceModifier: Number }],
  }],
  itemTotal: Number, // in pence
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestEmail: String,
  guestPhone: String,
  guestName: String,

  items: [orderItemSchema],

  fulfillmentType: { type: String, enum: ['delivery', 'collection'], required: true },
  deliveryAddress: {
    label: String,
    line1: String,
    line2: String,
    city: String,
    postcode: String,
    gateCode: String,
    deliveryPreference: String,
    driverNotes: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
  },

  scheduledFor: Date, // null = ASAP
  estimatedCookingMinutes: { type: Number, default: 20 },
  cookingStartedAt: Date,
  estimatedReadyTime: Date,
  estimatedDeliveryMinutes: { type: Number, default: 20 },
  estimatedDeliveredTime: Date,
  autoProgression: { type: Boolean, default: true },
  collectionPin: String, // 4-digit verification code for customer collection
  deliveryPin: String, // 4-digit verification code for delivery handover
  handoverPin: String, // Universal 4-digit PIN for collection or doorstep delivery
  rejectionReason: String, // Reason when order is rejected by admin/kitchen

  // Delivery Driver / Courier Details (Visible to customer upon dispatch)
  driver: {
    name: String,
    phone: String,
    vehicle: String,
    assignedAt: Date,
  },

  subtotal: { type: Number, required: true }, // in pence
  deliveryFee: { type: Number, default: 0 }, // in pence
  discount: { type: Number, default: 0 }, // in pence
  total: { type: Number, required: true }, // in pence

  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponCode: String,

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'collected', 'cancelled'],
    default: 'pending',
  },

  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
  }],

  paymentMethod: { type: String, enum: ['stripe', 'paypal', 'square', 'gocardless', 'cash'] },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  paymentIntentId: String,
  paymentReference: String,

  specialInstructions: String,
  adminNotes: String,

  smsSent: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    const date = new Date();
    this.orderNumber = `ORD-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
