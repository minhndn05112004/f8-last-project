const router = require('express').Router();
const {
  createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderById,
} = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.use(authenticateToken);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

router.get('/', authorizeRoles('ADMIN', 'STAFF'), getAllOrders);
router.put('/:id/status', authorizeRoles('ADMIN', 'STAFF'), updateOrderStatus);

module.exports = router;
