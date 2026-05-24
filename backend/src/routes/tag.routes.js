const router = require('express').Router();
const { getTags, createTag, deleteTag } = require('../controllers/tagController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// Public
router.get('/', getTags);

// Staff/Admin only
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), createTag);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteTag);

module.exports = router;
