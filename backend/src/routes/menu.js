const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');

// High-quality meal photos (Unsplash curated authentic South Indian / Indian cuisine)
const DEFAULT_MENU = [
  {
    _id: '655900000000000000000001',
    name: 'Malabar Chicken Dum Biriyani',
    description: 'Fragrant Kaima rice cooked dum-style with marinated chicken, ghee, fried onions, cashews, and raisins. Served with raita and date pickle.',
    price: 1399,
    category: 'Biriyani',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 2,
    isFeatured: true,
    isAvailable: true,
    allergens: [{ name: 'Dairy', contains: true }, { name: 'Nuts', contains: true }],
  },
  {
    _id: '655900000000000000000002',
    name: 'Malabar Mutton Dum Biriyani',
    description: 'Slow-cooked succulent tender British mutton layered with aromatic spiced rice, fresh mint, coriander, and caramelized onions.',
    price: 1549,
    category: 'Biriyani',
    image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 2,
    isFeatured: true,
    isAvailable: true,
    allergens: [{ name: 'Dairy', contains: true }, { name: 'Nuts', contains: true }],
  },
  {
    _id: '655900000000000000000003',
    name: 'Kerala Beef Fry (Ularthiyathu)',
    description: 'Signature tender beef slices slow-roasted with roasted coconut slivers, crushed black pepper, curry leaves, and traditional Kerala spices.',
    price: 1299,
    category: 'Kerala Specialities',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 3,
    isFeatured: true,
    isAvailable: true,
    allergens: [],
  },
  {
    _id: '655900000000000000000004',
    name: 'Kerala Chicken Roast',
    description: 'Country style chicken simmered in a semi-thick spicy onion-tomato gravy infused with roasted fennel and ginger.',
    price: 1199,
    category: 'Kerala Specialities',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&auto=format&fit=crop&q=80',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 2,
    isFeatured: false,
    isAvailable: true,
    allergens: [],
  },
  {
    _id: '655900000000000000000005',
    name: 'Alleppey Fish Curry',
    description: 'Fresh sea bass simmered in rich coconut milk flavored with raw mango, green chilies, and tempered curry leaves.',
    price: 1449,
    category: 'Kerala Specialities',
    image: 'https://images.unsplash.com/photo-1610057099431-d73a1c9d2f2f?w=800&auto=format&fit=crop&q=80',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 1,
    isFeatured: true,
    isAvailable: true,
    allergens: [{ name: 'Fish', contains: true }],
  },
  {
    _id: '655900000000000000000006',
    name: 'Kerala Porotta (2 pcs)',
    description: 'Multi-layered flaky, crispy golden flatbread made fresh on the hot griddle.',
    price: 349,
    category: 'Breads & Accompaniments',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
    isVegetarian: true,
    isFeatured: false,
    isAvailable: true,
    allergens: [{ name: 'Gluten', contains: true }],
  },
  {
    _id: '655900000000000000000007',
    name: 'Thattu Dosa (3 pcs) with Chutneys & Sambar',
    description: 'Street-style soft dosas served with fresh coconut chutney, spicy tomato chutney, and piping hot lentil sambar.',
    price: 799,
    category: 'Dosa & Starters',
    image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isFeatured: true,
    isAvailable: true,
    allergens: [],
  },
  {
    _id: '655900000000000000000008',
    name: 'Crispy Masala Dosa',
    description: 'Golden crispy rice and lentil crepe stuffed with tempered spiced potato masala, served with chutneys.',
    price: 899,
    category: 'Dosa & Starters',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
    isVegetarian: true,
    isGlutenFree: true,
    isFeatured: false,
    isAvailable: true,
    allergens: [],
  },
  {
    _id: '655900000000000000000009',
    name: 'Tapioca & Fish Curry (Kappa & Meen)',
    description: 'Steamed mashed tapioca tempered with mustard seeds and curry leaves, served alongside spicy coastal fish curry.',
    price: 1399,
    category: 'Kerala Specialities',
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
    isVegetarian: false,
    isSpicy: true,
    spiceLevel: 3,
    isFeatured: true,
    isAvailable: true,
    allergens: [{ name: 'Fish', contains: true }],
  },
  {
    _id: '655900000000000000000010',
    name: 'Vegetable Stew (Kerala Style)',
    description: 'Garden vegetables simmered in delicate, aromatic coconut milk flavored with whole spices and ginger.',
    price: 999,
    category: 'Vegetarian',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    isFeatured: false,
    isAvailable: true,
    allergens: [],
  },
  {
    _id: '655900000000000000000011',
    name: 'Crispy Punjabi Samosa (3 pcs)',
    description: 'Golden flaky pastries filled with spiced potatoes and peas, served with sweet tamarind and spicy mint chutneys.',
    price: 499,
    category: 'Dosa & Starters',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
    isVegetarian: true,
    isSpicy: true,
    spiceLevel: 1,
    isFeatured: false,
    isAvailable: true,
    allergens: [{ name: 'Gluten', contains: true }],
  },
  {
    _id: '655900000000000000000012',
    name: 'Mango Lassi',
    description: 'Chilled yogurt smoothie blended with sweet Alphonso mango pulp and a touch of cardamom.',
    price: 399,
    category: 'Drinks & Desserts',
    image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=80',
    isVegetarian: true,
    isFeatured: false,
    isAvailable: true,
    allergens: [{ name: 'Dairy', contains: true }],
  },
];

// Mutable in-memory store
let liveMenuItems = [...DEFAULT_MENU];

// Helper methods for in-memory mutations
const getInMemoryMenu = () => liveMenuItems;

const addInMemoryMenuItem = (itemData) => {
  const newItem = {
    _id: itemData._id || new mongoose.Types.ObjectId().toString(),
    name: itemData.name,
    description: itemData.description || '',
    price: Number(itemData.price) || 999,
    category: itemData.category || 'Specialities',
    image: itemData.image || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
    isVegetarian: Boolean(itemData.isVegetarian),
    isVegan: Boolean(itemData.isVegan),
    isGlutenFree: Boolean(itemData.isGlutenFree),
    isSpicy: Boolean(itemData.isSpicy || itemData.spiceLevel > 0),
    spiceLevel: Number(itemData.spiceLevel) || 0,
    isFeatured: Boolean(itemData.isFeatured),
    isAvailable: itemData.isAvailable !== false,
    preparationTime: Number(itemData.preparationTime) || 20,
    allergens: itemData.allergens || [],
    createdAt: new Date(),
  };
  liveMenuItems.unshift(newItem);
  return newItem;
};

const updateInMemoryMenuItem = (id, updates) => {
  const index = liveMenuItems.findIndex(i => i._id.toString() === id.toString());
  if (index === -1) return null;
  liveMenuItems[index] = {
    ...liveMenuItems[index],
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : liveMenuItems[index].price,
  };
  return liveMenuItems[index];
};

const deleteInMemoryMenuItem = (id) => {
  const initialLength = liveMenuItems.length;
  liveMenuItems = liveMenuItems.filter(i => i._id.toString() !== id.toString());
  return liveMenuItems.length < initialLength;
};

const toggleInMemoryMenuItem = (id) => {
  const item = liveMenuItems.find(i => i._id.toString() === id.toString());
  if (!item) return null;
  item.isAvailable = !item.isAvailable;
  return item;
};

const filterInMemory = ({ category, search, available }) => {
  let list = [...liveMenuItems];
  if (available !== 'false' && available !== undefined) list = list.filter(i => i.isAvailable);
  if (category && category !== 'All') list = list.filter(i => i.category === category);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(i => i.name.toLowerCase().includes(s) || i.description.toLowerCase().includes(s));
  }
  return list;
};

// @GET /api/menu - Public menu
router.get('/', async (req, res) => {
  try {
    let items;
    if (mongoose.connection.readyState === 1) {
      const { category, search, available } = req.query;
      const filter = {};
      if (category && category !== 'All') filter.category = category;
      if (available !== 'false') filter.isAvailable = true;
      if (search) filter.$text = { $search: search };
      items = await MenuItem.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });
      if (!items || items.length === 0) {
        items = filterInMemory(req.query);
      }
    } else {
      items = filterInMemory(req.query);
    }

    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    res.json({ success: true, items, grouped, total: items.length });
  } catch (error) {
    const fallbackItems = filterInMemory(req.query);
    const grouped = fallbackItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
    res.json({ success: true, items: fallbackItems, grouped, total: fallbackItems.length });
  }
});

// @GET /api/menu/categories
router.get('/categories', async (req, res) => {
  try {
    let categories;
    if (mongoose.connection.readyState === 1) {
      categories = await MenuItem.distinct('category', { isAvailable: true });
    }
    if (!categories || categories.length === 0) {
      categories = Array.from(new Set(liveMenuItems.map(i => i.category)));
    }
    res.json({ success: true, categories });
  } catch (error) {
    const categories = Array.from(new Set(liveMenuItems.map(i => i.category)));
    res.json({ success: true, categories });
  }
});

// @GET /api/menu/featured
router.get('/featured', async (req, res) => {
  try {
    let items;
    if (mongoose.connection.readyState === 1) {
      items = await MenuItem.find({ isFeatured: true, isAvailable: true }).limit(8);
    }
    if (!items || items.length === 0) {
      items = liveMenuItems.filter(i => i.isFeatured && i.isAvailable).slice(0, 8);
    }
    res.json({ success: true, items });
  } catch (error) {
    const items = liveMenuItems.filter(i => i.isFeatured && i.isAvailable).slice(0, 8);
    res.json({ success: true, items });
  }
});

// @GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    let item;
    if (mongoose.connection.readyState === 1) {
      item = await MenuItem.findById(req.params.id);
    }
    if (!item) {
      item = liveMenuItems.find(i => i._id.toString() === req.params.id);
    }
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    res.json({ success: true, item });
  } catch (error) {
    const item = liveMenuItems.find(i => i._id.toString() === req.params.id);
    if (item) return res.json({ success: true, item });
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.DEFAULT_MENU = DEFAULT_MENU;
module.exports.getInMemoryMenu = getInMemoryMenu;
module.exports.addInMemoryMenuItem = addInMemoryMenuItem;
module.exports.updateInMemoryMenuItem = updateInMemoryMenuItem;
module.exports.deleteInMemoryMenuItem = deleteInMemoryMenuItem;
module.exports.toggleInMemoryMenuItem = toggleInMemoryMenuItem;
