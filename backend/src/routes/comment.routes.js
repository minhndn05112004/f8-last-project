const router = require('express').Router();
const { deleteComment } = require('../controllers/newsController');
const { authenticateToken } = require('../middlewares/auth');

// DELETE /api/comments/:id — Auth required (own comment or ADMIN/STAFF)
router.delete('/:id', authenticateToken, deleteComment);

module.exports = router;
