const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  time: String, // e.g. "17:00"
  label: String, // e.g. "5:00 PM"
  maxOrders: { type: Number, default: 10 },
});

const dayScheduleSchema = new mongoose.Schema({
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '17:00' },
  closeTime: { type: String, default: '22:00' },
  timeSlots: [timeSlotSchema],
});

const restaurantSettingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: 'Your Restaurant' },
  phone: String,
  email: String,
  address: {
    line1: String,
    city: String,
    postcode: String,
  },
  deliveryRadius: { type: Number, default: 5 }, // miles
  minimumDeliveryOrder: { type: Number, default: 1500 }, // £15.00 in pence
  deliveryFee: { type: Number, default: 199 }, // £1.99 in pence
  freeDeliveryThreshold: { type: Number, default: 3000 }, // £30.00 in pence
  estimatedDeliveryTime: { type: Number, default: 45 }, // minutes
  estimatedCollectionTime: { type: Number, default: 20 }, // minutes
  acceptingOrders: { type: Boolean, default: true },
  schedule: {
    monday: { type: dayScheduleSchema, default: () => ({}) },
    tuesday: { type: dayScheduleSchema, default: () => ({}) },
    wednesday: { type: dayScheduleSchema, default: () => ({}) },
    thursday: { type: dayScheduleSchema, default: () => ({}) },
    friday: { type: dayScheduleSchema, default: () => ({}) },
    saturday: { type: dayScheduleSchema, default: () => ({}) },
    sunday: { type: dayScheduleSchema, default: () => ({}) },
  },
  closedDates: [Date],
  vatNumber: String,
  vatRate: { type: Number, default: 20 },
  currency: { type: String, default: 'GBP' },
  currencySymbol: { type: String, default: '£' },
  enabledPaymentMethods: {
    stripe: { type: Boolean, default: true },
    paypal: { type: Boolean, default: true },
    square: { type: Boolean, default: false },
    gocardless: { type: Boolean, default: false },
    cash: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema);
