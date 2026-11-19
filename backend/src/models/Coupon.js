const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,
  discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
  discountValue: { type: Number, required: true }, // percentage (0-100) or pence
  minimumOrder: { type: Number, default: 0 }, // in pence
  maximumDiscount: Number, // cap in pence (for percentage discounts)
  usageLimit: Number,
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  validFrom: Date,
  validUntil: Date,
  isActive: { type: Boolean, default: true },
  applicableCategories: [String], // empty = all categories
}, { timestamps: true });

couponSchema.methods.isValid = function (orderTotal) {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (this.validFrom && now < this.validFrom) return { valid: false, reason: 'Coupon not yet active' };
  if (this.validUntil && now > this.validUntil) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usageCount >= this.usageLimit) return { valid: false, reason: 'Coupon usage limit reached' };
  if (orderTotal < this.minimumOrder) return { valid: false, reason: `Minimum order of £${(this.minimumOrder / 100).toFixed(2)} required` };
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function (orderTotal) {
  let discount = 0;
  if (this.discountType === 'percentage') {
    discount = Math.round(orderTotal * (this.discountValue / 100));
    if (this.maximumDiscount) discount = Math.min(discount, this.maximumDiscount);
  } else {
    discount = Math.min(this.discountValue, orderTotal);
  }
  return discount;
};

module.exports = mongoose.model('Coupon', couponSchema);
