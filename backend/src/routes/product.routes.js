const router = require('express').Router();
const {
  getProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  togglePublish,
  getRelatedProducts,
  getAllProductsAdmin,
} = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.get('/', getProducts);
router.get('/related', getRelatedProducts);
router.get('/slug/:slug', getProductBySlug);

// ─── Staff/Admin Routes ───────────────────────────────────────────────────────
router.get('/all', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), getAllProductsAdmin);
router.get('/:id', getProductById);

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
router.patch('/:id/publish', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), togglePublish);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), deleteProduct);

module.exports = router;
