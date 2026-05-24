const router = require('express').Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderById,
  getPaymentStatus,
  getOrderByCode,
} = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateToken);

// ─── User Routes ──────────────────────────────────────────────────────────────
router.post('/', createOrder);
router.get('/my-orders', getMyOrders);

// ─── Specific routes before wildcard /:id ─────────────────────────────────────
// These must come BEFORE /:id to avoid Express matching them as numeric IDs
router.get('/code/:orderCode', getOrderByCode);
router.get('/:orderCode/payment-status', getPaymentStatus);

// Wildcard by numeric id — phải đặt CUỐI
router.get('/:id', getOrderById);

// ─── Staff / Admin Routes ─────────────────────────────────────────────────────
router.get('/', authorizeRoles('ADMIN', 'STAFF'), getAllOrders);
router.put('/:id/status', authorizeRoles('ADMIN', 'STAFF'), updateOrderStatus);
router.put('/:id/payment-status', authorizeRoles('ADMIN', 'STAFF'), updatePaymentStatus);

module.exports = router;
