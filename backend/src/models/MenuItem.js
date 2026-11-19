const mongoose = require('mongoose');

const allergenSchema = new mongoose.Schema({
  name: String,
  contains: Boolean,
  mayContain: Boolean,
});

const optionItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  priceModifier: { type: Number, default: 0 }, // in pence
});

const optionGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  required: { type: Boolean, default: false },
  multiSelect: { type: Boolean, default: false },
  items: [optionItemSchema],
});

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true }, // in pence (GBP)
  category: { type: String, required: true },
  subcategory: String,
  image: { type: String },
  imagePublicId: String,
  isAvailable: { type: Boolean, default: true },
  isVegetarian: { type: Boolean, default: false },
  isVegan: { type: Boolean, default: false },
  isGlutenFree: { type: Boolean, default: false },
  isSpicy: { type: Boolean, default: false },
  spiceLevel: { type: Number, min: 0, max: 3, default: 0 }, // 0=mild, 1=medium, 2=hot, 3=extra hot
  allergens: [allergenSchema],
  options: [optionGroupSchema],
  calories: Number,
  sortOrder: { type: Number, default: 0 },
  isFeatured: { type: Boolean, default: false },
  tags: [String],
}, { timestamps: true });

menuItemSchema.index({ category: 1, isAvailable: 1 });
menuItemSchema.index({ name: 'text', description: 'text' });

// Virtual: price in pounds
menuItemSchema.virtual('priceGBP').get(function () {
  return (this.price / 100).toFixed(2);
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
