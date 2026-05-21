const router = require('express').Router();
const {
  getNews,
  getLatestNews,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  getComments,
  addComment,
  deleteComment,
  reactToNews,
  getMyReaction,
} = require('../controllers/newsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// ─── Public Routes ────────────────────────────────────────────────────────────

// IMPORTANT: /latest must be before /:slug to avoid route conflict
router.get('/latest', getLatestNews);
router.get('/', getNews);
router.get('/:slug', getNewsBySlug);

// ─── Comments (Public read, Auth write) ───────────────────────────────────────

router.get('/:id/comments', getComments);
router.post('/:id/comments', authenticateToken, addComment);
router.post('/:id/react', authenticateToken, reactToNews);
router.get('/:id/my-reaction', authenticateToken, getMyReaction);

// ─── Staff/Admin Routes ───────────────────────────────────────────────────────

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), upload.single('thumbnail'), createNews);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), upload.single('thumbnail'), updateNews);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'STAFF'), deleteNews);

module.exports = router;
