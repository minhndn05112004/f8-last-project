const router = require('express').Router();
const { getNews, getNewsBySlug, createNews, updateNews, deleteNews } = require('../controllers/newsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Public
router.get('/', getNews);
router.get('/:slug', getNewsBySlug);

// Admin/Staff
router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), upload.single('thumbnail'), createNews);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), upload.single('thumbnail'), updateNews);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), deleteNews);

module.exports = router;
