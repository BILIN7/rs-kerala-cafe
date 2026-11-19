require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const RestaurantSettings = require('../models/RestaurantSettings');
const Coupon = require('../models/Coupon');
const connectDB = require('../config/db');

const menuItems = [
  // Kerala & South Indian Specialities (Reference: RS Kerala Cafe Manchester)
  {
    name: 'Malabar Chicken Dum Biriyani',
    description: 'Fragrant Kaima rice cooked dum-style with marinated chicken, ghee, fried onions, cashews, and raisins. Served with raita, pickle, and date chutney.',
    price: 1399,
    category: 'Biriyani',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 2,
    isFeatured: true,
    allergens: [{ name: 'Dairy', contains: true }, { name: 'Nuts', contains: true }],
  },
  {
    name: 'Malabar Mutton Dum Biriyani',
    description: 'Slow-cooked succulent British mutton layered with aromatic spiced rice, mint, coriander, and caramelized onions.',
    price: 1549,
    category: 'Biriyani',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 2,
    isFeatured: true,
    allergens: [{ name: 'Dairy', contains: true }, { name: 'Nuts', contains: true }],
  },
  {
    name: 'Kerala Beef Fry (Ularthiyathu)',
    description: 'Signature tender beef slices slow-roasted with coconut slivers, crushed black pepper, curry leaves, and traditional Kerala spices.',
    price: 1299,
    category: 'Kerala Specialities',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 3,
    isFeatured: true,
    allergens: [],
  },
  {
    name: 'Kerala Chicken Roast',
    description: 'Country style chicken simmered in a semi-thick spicy onion-tomato gravy infused with fennel and ginger.',
    price: 1199,
    category: 'Kerala Specialities',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 2,
    allergens: [],
  },
  {
    name: 'Alleppey Fish Curry',
    description: 'Fresh boneless sea bass simmered in creamy coconut milk flavored with raw mango, green chilies, and curry leaves.',
    price: 1449,
    category: 'Kerala Specialities',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 1,
    isFeatured: true,
    allergens: [{ name: 'Fish', contains: true }],
  },
  {
    name: 'Kerala Porotta (2 pcs)',
    description: 'Multi-layered flaky, crispy flatbread made fresh on the hot griddle.',
    price: 349,
    category: 'Breads & Accompaniments',
    isVegetarian: true,
    allergens: [{ name: 'Gluten', contains: true }],
  },
  {
    name: 'Appam (2 pcs)',
    description: 'Soft and fluffy fermented rice and coconut milk hopper with lacy crispy edges. Best paired with stew or roast.',
    price: 399,
    category: 'Breads & Accompaniments',
    isVegetarian: true,
    isGlutenFree: true,
    allergens: [],
  },
  {
    name: 'Thattu Dosa (3 pcs) with Chutneys & Sambar',
    description: 'Street-style thick soft dosas served with fresh coconut chutney, tomato chutney, and piping hot lentil sambar.',
    price: 799,
    category: 'Dosa & Starters',
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    allergens: [],
  },
  {
    name: 'Masala Dosa',
    description: 'Golden crispy rice and lentil crepe stuffed with tempered spiced potato masala.',
    price: 899,
    category: 'Dosa & Starters',
    isVegetarian: true,
    isGlutenFree: true,
    allergens: [],
  },
  {
    name: 'Tapioca & Fish Curry (Kappa & Meen)',
    description: 'Steamed mashed tapioca tempered with mustard seeds and curry leaves, served alongside spicy red fish curry.',
    price: 1399,
    category: 'Kerala Specialities',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 3,
    isFeatured: true,
    allergens: [{ name: 'Fish', contains: true }],
  },
  {
    name: 'Vegetable Stew (Kerala Style)',
    description: 'Carrots, beans, potatoes simmered in delicate, aromatic coconut milk flavored with whole spices and ginger.',
    price: 999,
    category: 'Vegetarian',
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    allergens: [],
  },
  {
    name: 'Paneer Butter Masala',
    description: 'Fresh Indian cottage cheese simmered in a creamy, velvety spiced tomato and butter sauce.',
    price: 1099,
    category: 'Vegetarian',
    isVegetarian: true,
    isFeatured: false,
    allergens: [{ name: 'Dairy', contains: true }],
  },
  {
    name: 'Chicken Samosa (3 pcs)',
    description: 'Crispy pastry filled with spiced minced chicken, served with sweet date and tangy mint chutneys.',
    price: 499,
    category: 'Dosa & Starters',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 1,
    allergens: [{ name: 'Gluten', contains: true }],
  },
  {
    name: 'Mango Lassi',
    description: 'Chilled yogurt smoothie blended with sweet Alphonso mango pulp and a touch of cardamom.',
    price: 399,
    category: 'Drinks & Desserts',
    isVegetarian: true,
    allergens: [{ name: 'Dairy', contains: true }],
  },
  {
    name: 'Payasam (Kerala Rice Kheer)',
    description: 'Traditional slow-cooked festive pudding made with roasted vermicelli, jaggery/milk, ghee-roasted cashews, and cardamom.',
    price: 449,
    category: 'Drinks & Desserts',
    isVegetarian: true,
    allergens: [{ name: 'Dairy', contains: true }, { name: 'Nuts', contains: true }],
  },
];

const seed = async () => {
  await connectDB();
  console.log('Seeding menu items...');
  await MenuItem.deleteMany({});
  await MenuItem.insertMany(menuItems);
  console.log(`Seeded ${menuItems.length} menu items!`);

  // Initial settings
  const existingSettings = await RestaurantSettings.findOne();
  if (!existingSettings) {
    await RestaurantSettings.create({
      restaurantName: 'RS Kerala Cafe Manchester',
      phone: '+44 161 998 7654',
      email: 'orders@rskeralacafe.co.uk',
      address: {
        line1: '303 Palatine Rd, Northenden',
        city: 'Manchester',
        postcode: 'M22 4HH',
      },
      deliveryRadius: 6,
      minimumDeliveryOrder: 1500, // £15.00
      deliveryFee: 199, // £1.99
      freeDeliveryThreshold: 3500, // £35.00
      estimatedDeliveryTime: 45,
      estimatedCollectionTime: 20,
      enabledPaymentMethods: {
        stripe: true,
        paypal: true,
        square: true,
        gocardless: true,
        cash: true,
      },
    });
    console.log('Seeded restaurant settings!');
  }

  // Welcome coupon
  const existingCoupon = await Coupon.findOne({ code: 'WELCOME10' });
  if (!existingCoupon) {
    await Coupon.create({
      code: 'WELCOME10',
      description: '10% off your order',
      discountType: 'percentage',
      discountValue: 10,
      minimumOrder: 1500, // £15 min
      maximumDiscount: 500, // £5 max discount
      isActive: true,
    });
    console.log('Seeded promo coupon WELCOME10!');
  }

  console.log('Database seeding complete!');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
