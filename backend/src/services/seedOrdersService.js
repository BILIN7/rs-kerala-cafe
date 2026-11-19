const mongoose = require('mongoose');
const Order = require('../models/Order');

/**
 * Returns a list of realistic RS Kerala Cafe orders for Today and Previous days
 */
function generateDefaultOrders() {
  const now = new Date();

  // Helper for dates
  const todayAt = (hours, minutes) => {
    const d = new Date(now);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const daysAgoAt = (days, hours, minutes) => {
    const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const orders = [
    // ══════════════════════════════════════════════════════════════════
    // TODAY'S ORDERS
    // ══════════════════════════════════════════════════════════════════
    {
      _id: '655910000000000000000801',
      orderNumber: 'RS-801',
      guestName: 'Rahul Nair',
      guestPhone: '07700 900123',
      guestEmail: 'rahul.nair@manchester.ac.uk',
      fulfillmentType: 'collection',
      collectionPin: '4821',
      handoverPin: '4821',
      status: 'preparing',
      autoProgression: true,
      estimatedCookingMinutes: 20,
      cookingStartedAt: todayAt(11, 40),
      estimatedReadyTime: new Date(todayAt(11, 40).getTime() + 20 * 60000),
      items: [
        {
          menuItem: '655900000000000000000001',
          name: 'Malabar Chicken Dum Biriyani',
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
          price: 1399,
          quantity: 2,
          itemTotal: 2798,
        },
        {
          menuItem: '655900000000000000000006',
          name: 'Kerala Porotta (2 pcs)',
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
          price: 349,
          quantity: 2,
          itemTotal: 698,
        },
        {
          menuItem: '655900000000000000000012',
          name: 'Mango Lassi',
          image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=80',
          price: 399,
          quantity: 2,
          itemTotal: 798,
        },
      ],
      subtotal: 4294,
      deliveryFee: 0,
      discount: 0,
      total: 4294,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      paymentIntentId: 'pi_live_rs801_rahul',
      specialInstructions: 'Please pack extra raita and spicy date pickle. Collecting at counter around 12:15pm.',
      statusHistory: [
        { status: 'pending', timestamp: todayAt(11, 35), note: 'Order placed by customer via card' },
        { status: 'confirmed', timestamp: todayAt(11, 38), note: 'Accepted by kitchen staff' },
        { status: 'preparing', timestamp: todayAt(11, 40), note: 'Chef started cooking Malabar Dum Biriyani (20 mins)' },
      ],
      createdAt: todayAt(11, 35),
      updatedAt: todayAt(11, 40),
    },

    {
      _id: '655910000000000000000802',
      orderNumber: 'RS-802',
      guestName: 'Dr. Ananya Pillai',
      guestPhone: '07700 900456',
      guestEmail: 'ananya.pillai@mft.nhs.uk',
      fulfillmentType: 'delivery',
      deliveryAddress: {
        line1: 'Flat 4B, The Birches, 42 Wilmslow Road',
        line2: 'Didsbury',
        city: 'Manchester',
        postcode: 'M20 2BW',
        gateCode: '#4022',
        deliveryPreference: 'Leave with reception concierge if not answering intercom',
        driverNotes: 'Building entrance is next to Didsbury Park gates',
        coordinates: { lat: 53.4182, lng: -2.2314 },
      },
      deliveryPin: '8392',
      handoverPin: '8392',
      status: 'out_for_delivery',
      autoProgression: true,
      estimatedCookingMinutes: 20,
      cookingStartedAt: todayAt(11, 15),
      estimatedReadyTime: todayAt(11, 35),
      estimatedDeliveryMinutes: 15,
      estimatedDeliveredTime: new Date(todayAt(11, 38).getTime() + 15 * 60000),
      driver: {
        name: 'Suresh Kumar',
        phone: '07700 900888',
        vehicle: 'Honda PCX 125 Scooter (Black)',
        assignedAt: todayAt(11, 38),
      },
      items: [
        {
          menuItem: '655900000000000000000003',
          name: 'Kerala Beef Fry (Ularthiyathu)',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
          price: 1299,
          quantity: 1,
          itemTotal: 1299,
        },
        {
          menuItem: '655900000000000000000002',
          name: 'Malabar Mutton Dum Biriyani',
          image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
          price: 1549,
          quantity: 1,
          itemTotal: 1549,
        },
        {
          menuItem: '655900000000000000000006',
          name: 'Kerala Porotta (2 pcs)',
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
          price: 349,
          quantity: 2,
          itemTotal: 698,
        },
      ],
      subtotal: 3546,
      deliveryFee: 0,
      discount: 0,
      total: 3546,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      paymentIntentId: 'pi_live_rs802_ananya',
      specialInstructions: 'Authentic Kerala spice level preferred. Thank you!',
      statusHistory: [
        { status: 'pending', timestamp: todayAt(11, 10), note: 'Order placed by customer via card' },
        { status: 'confirmed', timestamp: todayAt(11, 12), note: 'Order accepted' },
        { status: 'preparing', timestamp: todayAt(11, 15), note: 'Cooking started' },
        { status: 'out_for_delivery', timestamp: todayAt(11, 38), note: 'Dispatched with driver Suresh Kumar (Honda PCX 125)' },
      ],
      createdAt: todayAt(11, 10),
      updatedAt: todayAt(11, 38),
    },

    {
      _id: '655910000000000000000803',
      orderNumber: 'RS-803',
      guestName: 'David Smith',
      guestPhone: '07700 900789',
      guestEmail: 'david.smith@postgrad.manchester.ac.uk',
      fulfillmentType: 'delivery',
      deliveryAddress: {
        line1: '15 Palatine Road',
        city: 'Northenden, Manchester',
        postcode: 'M22 4HH',
        deliveryPreference: 'Ring doorbell twice upon arrival',
        coordinates: { lat: 53.4072, lng: -2.2519 },
      },
      deliveryPin: '6149',
      handoverPin: '6149',
      status: 'pending',
      autoProgression: true,
      estimatedCookingMinutes: 25,
      items: [
        {
          menuItem: '655900000000000000000005',
          name: 'Alleppey Fish Curry',
          image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
          price: 1449,
          quantity: 1,
          itemTotal: 1449,
        },
        {
          menuItem: '655900000000000000000007',
          name: 'Thattu Dosa (3 pcs) with Chutneys & Sambar',
          image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=800&auto=format&fit=crop&q=80',
          price: 799,
          quantity: 1,
          itemTotal: 799,
        },
      ],
      subtotal: 2248,
      deliveryFee: 199,
      discount: 0,
      total: 2447,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      specialInstructions: 'Medium spice please. Have exact cash £24.50 ready.',
      statusHistory: [
        { status: 'pending', timestamp: todayAt(11, 48), note: 'Customer ordered with Cash on Delivery' },
      ],
      createdAt: todayAt(11, 48),
      updatedAt: todayAt(11, 48),
    },

    {
      _id: '655910000000000000000804',
      orderNumber: 'RS-804',
      guestName: 'Fiona Gallagher',
      guestPhone: '07700 900654',
      guestEmail: 'fiona.g@outlook.com',
      fulfillmentType: 'collection',
      collectionPin: '7315',
      handoverPin: '7315',
      status: 'ready',
      autoProgression: true,
      estimatedCookingMinutes: 15,
      cookingStartedAt: todayAt(11, 0),
      estimatedReadyTime: todayAt(11, 15),
      items: [
        {
          menuItem: '655900000000000000000008',
          name: 'Crispy Masala Dosa',
          image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
          price: 899,
          quantity: 2,
          itemTotal: 1798,
        },
        {
          menuItem: '655900000000000000000011',
          name: 'Crispy Punjabi Samosa (3 pcs)',
          image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
          price: 499,
          quantity: 1,
          itemTotal: 499,
        },
        {
          menuItem: '655900000000000000000012',
          name: 'Mango Lassi',
          image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=80',
          price: 399,
          quantity: 1,
          itemTotal: 399,
        },
      ],
      subtotal: 2696,
      deliveryFee: 0,
      discount: 0,
      total: 2696,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      paymentIntentId: 'pi_live_rs804_fiona',
      specialInstructions: 'Extra coconut chutney please!',
      statusHistory: [
        { status: 'pending', timestamp: todayAt(10, 55), note: 'Order placed by customer' },
        { status: 'confirmed', timestamp: todayAt(10, 58), note: 'Order confirmed' },
        { status: 'preparing', timestamp: todayAt(11, 0), note: 'Cooking in progress' },
        { status: 'ready', timestamp: todayAt(11, 16), note: 'Packed hot and ready at counter' },
      ],
      createdAt: todayAt(10, 55),
      updatedAt: todayAt(11, 16),
    },

    {
      _id: '655910000000000000000805',
      orderNumber: 'RS-805',
      guestName: 'Priya Menon',
      guestPhone: '07700 900321',
      guestEmail: 'priya.menon@gmail.com',
      fulfillmentType: 'delivery',
      deliveryAddress: {
        line1: '88 Princess Road',
        line2: 'Moss Side',
        city: 'Manchester',
        postcode: 'M14 4TH',
        deliveryPreference: 'Handover at front door',
        coordinates: { lat: 53.4560, lng: -2.2350 },
      },
      deliveryPin: '9021',
      handoverPin: '9021',
      status: 'delivered',
      driver: {
        name: 'Muhammad Ali',
        phone: '07700 900555',
        vehicle: 'Yamaha NMAX 125 Scooter',
        assignedAt: todayAt(10, 25),
      },
      items: [
        {
          menuItem: '655900000000000000000009',
          name: 'Tapioca & Fish Curry (Kappa & Meen)',
          image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&auto=format&fit=crop&q=80',
          price: 1399,
          quantity: 1,
          itemTotal: 1399,
        },
        {
          menuItem: '655900000000000000000010',
          name: 'Vegetable Stew (Kerala Style)',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          price: 999,
          quantity: 1,
          itemTotal: 999,
        },
        {
          menuItem: '655900000000000000000006',
          name: 'Kerala Porotta (2 pcs)',
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
          price: 349,
          quantity: 2,
          itemTotal: 698,
        },
      ],
      subtotal: 3096,
      deliveryFee: 199,
      discount: 0,
      total: 3295,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      paymentIntentId: 'pi_live_rs805_priya',
      statusHistory: [
        { status: 'pending', timestamp: todayAt(9, 45), note: 'Order placed' },
        { status: 'confirmed', timestamp: todayAt(9, 48), note: 'Order accepted' },
        { status: 'preparing', timestamp: todayAt(9, 50), note: 'Cooking started' },
        { status: 'out_for_delivery', timestamp: todayAt(10, 15), note: 'Dispatched with courier Muhammad Ali' },
        { status: 'delivered', timestamp: todayAt(10, 42), note: 'Delivered at doorstep. Verified with PIN 9021.' },
      ],
      createdAt: todayAt(9, 45),
      updatedAt: todayAt(10, 42),
    },

    // ══════════════════════════════════════════════════════════════════
    // PREVIOUS ORDERS (Yesterday to 5 Days Ago)
    // ══════════════════════════════════════════════════════════════════
    {
      _id: '655910000000000000000790',
      orderNumber: 'RS-790',
      guestName: 'Sarah Jenkins',
      guestPhone: '07700 900111',
      guestEmail: 'sarah.jenkins@gmail.com',
      fulfillmentType: 'delivery',
      deliveryAddress: {
        line1: '24 Barlow Moor Road',
        line2: 'Chorlton',
        city: 'Manchester',
        postcode: 'M21 0BQ',
        coordinates: { lat: 53.4410, lng: -2.2740 },
      },
      deliveryPin: '3318',
      handoverPin: '3318',
      status: 'delivered',
      driver: {
        name: 'Suresh Kumar',
        phone: '07700 900888',
        vehicle: 'Honda PCX 125 Scooter',
      },
      items: [
        {
          menuItem: '655900000000000000000001',
          name: 'Malabar Chicken Dum Biriyani',
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
          price: 1399,
          quantity: 2,
          itemTotal: 2798,
        },
        {
          menuItem: '655900000000000000000011',
          name: 'Crispy Punjabi Samosa (3 pcs)',
          image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800&auto=format&fit=crop&q=80',
          price: 499,
          quantity: 1,
          itemTotal: 499,
        },
      ],
      subtotal: 3297,
      deliveryFee: 0,
      total: 3297,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      createdAt: daysAgoAt(1, 19, 15),
      updatedAt: daysAgoAt(1, 20, 0),
    },

    {
      _id: '655910000000000000000785',
      orderNumber: 'RS-785',
      guestName: 'George Varghese',
      guestPhone: '07700 900222',
      guestEmail: 'george.v@salford.ac.uk',
      fulfillmentType: 'collection',
      collectionPin: '9134',
      handoverPin: '9134',
      status: 'collected',
      items: [
        {
          menuItem: '655900000000000000000004',
          name: 'Kerala Chicken Roast',
          image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=800&auto=format&fit=crop&q=80',
          price: 1199,
          quantity: 1,
          itemTotal: 1199,
        },
        {
          menuItem: '655900000000000000000006',
          name: 'Kerala Porotta (2 pcs)',
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
          price: 349,
          quantity: 3,
          itemTotal: 1047,
        },
        {
          menuItem: '655900000000000000000012',
          name: 'Mango Lassi',
          image: 'https://images.unsplash.com/photo-1553787499-6f9133860278?w=800&auto=format&fit=crop&q=80',
          price: 399,
          quantity: 2,
          itemTotal: 798,
        },
      ],
      subtotal: 3044,
      deliveryFee: 0,
      total: 3044,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      createdAt: daysAgoAt(2, 18, 40),
      updatedAt: daysAgoAt(2, 19, 15),
    },

    {
      _id: '655910000000000000000778',
      orderNumber: 'RS-778',
      guestName: 'Mark Evans',
      guestPhone: '07700 900333',
      guestEmail: 'mevans@manchestertech.co.uk',
      fulfillmentType: 'delivery',
      deliveryAddress: {
        line1: '7 Elm Grove',
        city: 'Didsbury, Manchester',
        postcode: 'M20 6PL',
        coordinates: { lat: 53.4150, lng: -2.2300 },
      },
      deliveryPin: '4481',
      handoverPin: '4481',
      status: 'delivered',
      driver: {
        name: 'Muhammad Ali',
        phone: '07700 900555',
        vehicle: 'Yamaha NMAX 125 Scooter',
      },
      items: [
        {
          menuItem: '655900000000000000000002',
          name: 'Malabar Mutton Dum Biriyani',
          image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
          price: 1549,
          quantity: 2,
          itemTotal: 3098,
        },
        {
          menuItem: '655900000000000000000003',
          name: 'Kerala Beef Fry (Ularthiyathu)',
          image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
          price: 1299,
          quantity: 1,
          itemTotal: 1299,
        },
      ],
      subtotal: 4397,
      deliveryFee: 0,
      total: 4397,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      createdAt: daysAgoAt(3, 20, 10),
      updatedAt: daysAgoAt(3, 20, 50),
    },

    {
      _id: '655910000000000000000771',
      orderNumber: 'RS-771',
      guestName: 'Emily Clark',
      guestPhone: '07700 900444',
      guestEmail: 'emily.clark92@yahoo.co.uk',
      fulfillmentType: 'collection',
      collectionPin: '5192',
      handoverPin: '5192',
      status: 'cancelled',
      rejectionReason: 'Customer called to cancel: change of travel plans. Full refund returned.',
      items: [
        {
          menuItem: '655900000000000000000008',
          name: 'Crispy Masala Dosa',
          image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800&auto=format&fit=crop&q=80',
          price: 899,
          quantity: 2,
          itemTotal: 1798,
        },
        {
          menuItem: '655900000000000000000010',
          name: 'Vegetable Stew (Kerala Style)',
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
          price: 999,
          quantity: 1,
          itemTotal: 999,
        },
      ],
      subtotal: 2797,
      deliveryFee: 0,
      total: 2797,
      paymentMethod: 'stripe',
      paymentStatus: 'refunded',
      createdAt: daysAgoAt(4, 17, 30),
      updatedAt: daysAgoAt(4, 17, 45),
    },

    {
      _id: '655910000000000000000765',
      orderNumber: 'RS-765',
      guestName: 'Dr. Tariq Farooq',
      guestPhone: '07700 900555',
      guestEmail: 'tariq.farooq@manchester.gov.uk',
      fulfillmentType: 'delivery',
      deliveryAddress: {
        line1: '55 Wilbraham Road',
        line2: 'Fallowfield',
        city: 'Manchester',
        postcode: 'M14 7FB',
        coordinates: { lat: 53.4440, lng: -2.2210 },
      },
      deliveryPin: '8832',
      handoverPin: '8832',
      status: 'delivered',
      driver: {
        name: 'Suresh Kumar',
        phone: '07700 900888',
        vehicle: 'Honda PCX 125 Scooter',
      },
      items: [
        {
          menuItem: '655900000000000000000001',
          name: 'Malabar Chicken Dum Biriyani',
          image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80',
          price: 1399,
          quantity: 3,
          itemTotal: 4197,
        },
        {
          menuItem: '655900000000000000000002',
          name: 'Malabar Mutton Dum Biriyani',
          image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
          price: 1549,
          quantity: 2,
          itemTotal: 3098,
        },
        {
          menuItem: '655900000000000000000006',
          name: 'Kerala Porotta (2 pcs)',
          image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
          price: 349,
          quantity: 4,
          itemTotal: 1396,
        },
      ],
      subtotal: 8691,
      deliveryFee: 0,
      total: 8691,
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      createdAt: daysAgoAt(5, 19, 0),
      updatedAt: daysAgoAt(5, 20, 10),
    },
  ];

  return orders;
}

/**
 * Seed default orders into inMemoryOrders map and MongoDB (if active)
 */
async function seedDefaultOrders(inMemoryMap) {
  const defaultList = generateDefaultOrders();

  // Populate in-memory map
  if (inMemoryMap) {
    for (const o of defaultList) {
      inMemoryMap.set(o._id, o);
    }
  }

  // Populate MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      for (const orderData of defaultList) {
        await Order.findByIdAndUpdate(orderData._id, orderData, { upsert: true, new: true, setDefaultsOnInsert: true });
      }
    } catch (e) {
      console.warn('MongoDB seed warning:', e.message);
    }
  }

  return defaultList;
}

module.exports = {
  generateDefaultOrders,
  seedDefaultOrders,
};
