const router = require('express').Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartCount } = require('../controllers/cartController');
const { authenticateToken } = require('../middlewares/auth');

// All cart routes require authentication
router.use(authenticateToken);

router.get('/', getCart);
router.get('/count', getCartCount);
router.post('/add', addToCart);
router.put('/item/:id', updateCartItem);
router.delete('/clear', clearCart);
router.delete('/item/:id', removeFromCart);

module.exports = router;
