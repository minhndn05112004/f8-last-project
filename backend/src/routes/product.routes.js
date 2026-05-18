const router = require('express').Router();
const {
  getProducts, getProductById,
  createProduct, updateProduct, deleteProduct,
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin/Staff only
router.post(
  '/',
  authenticateToken,
  authorizeRoles('ADMIN', 'STAFF'),
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 8 }]),
  createProduct
);
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'STAFF'),
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'images', maxCount: 8 }]),
  updateProduct
);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), deleteProduct);

module.exports = router;
