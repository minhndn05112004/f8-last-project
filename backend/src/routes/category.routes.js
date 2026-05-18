const router = require('express').Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

router.get('/', getCategories);
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), createCategory);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), updateCategory);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteCategory);

module.exports = router;
