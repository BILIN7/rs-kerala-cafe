require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { initSocketService } = require('./services/socketService');
const { initOrderProgressionEngine } = require('./services/orderProgressionService');

// Route imports
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');
const uploadRoutes = require('./routes/upload');

const app = express();
const server = http.createServer(app);

// CORS origins helper: supports Netlify, custom domains, and local dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : []),
];

const corsOriginCheck = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (
    allowedOrigins.includes(origin) ||
    /\.netlify\.app$/.test(origin) ||
    /rskeralacafe/i.test(origin)
  ) {
    return callback(null, true);
  }
  return callback(null, true); // Permissive for easy demo deployment
};

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocketService(io);
initOrderProgressionEngine();

// Connect to DB
connectDB();

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: corsOriginCheck,
  credentials: true,
}));

// Stripe webhook needs raw body
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), timezone: process.env.RESTAURANT_TIMEZONE });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, io };
