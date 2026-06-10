const router = require('express').Router();
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  getOrderByCode,
  getPaymentStatus,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  assignShipper,
  selfAssignShipper,
  getShipperOrders,
  getOrderStats,
  getShippers,
} = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateToken);

// ─── Customer Routes ──────────────────────────────────────────────────────────
router.post('/',            createOrder);
router.get('/my-orders',    getMyOrders);

// ─── Specific routes before wildcard /:id ─────────────────────────────────────
router.get('/code/:orderCode',             getOrderByCode);
router.get('/:orderCode/payment-status',   getPaymentStatus);

// ─── Admin / Staff: Quản lý đơn hàng ─────────────────────────────────────────
router.get('/stats',    authorizeRoles('ADMIN'), getOrderStats);
router.get('/shippers', authorizeRoles('ADMIN'), getShippers);
router.get('/',         authorizeRoles('ADMIN', 'STAFF', 'SHIPPER'), getAllOrders);

router.put('/:id/status',         authorizeRoles('ADMIN', 'STAFF'), updateOrderStatus);
router.put('/:id/payment-status', authorizeRoles('ADMIN', 'STAFF'), updatePaymentStatus);
router.put('/:id/cancel',         authorizeRoles('ADMIN', 'STAFF'), cancelOrder);

// ─── Admin: Phân công shipper ─────────────────────────────────────────────────
router.put('/:id/assign-shipper', authorizeRoles('ADMIN'), assignShipper);

// ─── Shipper Routes ───────────────────────────────────────────────────────────
router.get('/shipper/my-orders',  authorizeRoles('SHIPPER', 'ADMIN'), getShipperOrders);
router.put('/:id/self-assign',    authorizeRoles('SHIPPER'), selfAssignShipper);
// Shipper cập nhật trạng thái (DELIVERING / DELIVERED) dùng chung updateOrderStatus
router.put('/:id/shipper-status', authorizeRoles('SHIPPER'), updateOrderStatus);

// ─── Wildcard by numeric id — phải đặt CUỐI ───────────────────────────────────
router.get('/:id', getOrderById);

module.exports = router;
