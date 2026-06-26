require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const tagRoutes = require('./routes/tag.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const newsRoutes = require('./routes/news.routes');
const commentRoutes = require('./routes/comment.routes');
const supportRoutes = require('./routes/support.routes');
const paymentRoutes = require('./routes/paymentRoutes');
const sepayRoutes = require('./routes/sepay.routes');  // POST /api/payment/sepay-webhook
const adminRoutes = require('./routes/admin.routes');

// Middleware
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://f8-last-project.vercel.app',
      'https://www.ngodinhnhatminh.name.vn',
      'https://ngodinhnhatminh.name.vn'
    ];
    // Cho phép tất cả *.vercel.app subdomain của project
    const vercelPreview = /^https:\/\/f8-last-project.*\.vercel\.app$/;

    if (!origin || allowedOrigins.includes(origin) || vercelPreview.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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
app.use('/api/tags', tagRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/payment', sepayRoutes);   // POST /api/payment/sepay-webhook (SePay webhook riêng)
app.use('/api/admin', adminRoutes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🥩 Anthony Shop API is running',
    version: '2.0.0',
    endpoints: [
      'GET  /api/auth/me',
      'POST /api/auth/login',
      'GET  /api/products',
      'GET  /api/products/slug/:slug',
      'GET  /api/tags',
      'POST /api/tags',
      'GET  /api/cart',
      'POST /api/cart/add',
      'GET  /api/news',
    ],
  });
});
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// ─── 404 Handler ──────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────

app.use(errorHandler);

module.exports = app;
