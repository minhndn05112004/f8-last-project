require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const categoryRoutes = require('./routes/category.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const newsRoutes = require('./routes/news.routes');
const supportRoutes = require('./routes/support.routes');


// Middleware
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/support', supportRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🥩 Meat Shop API is running',
    version: '1.0.0',
    endpoints: [
      'GET  /api/auth/me',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET  /api/products',
      'GET  /api/categories',
      'GET  /api/cart',
      'POST /api/orders',
      'GET  /api/news',
    ],
  });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

module.exports = app;
