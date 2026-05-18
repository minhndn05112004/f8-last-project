const router = require('express').Router();
const { register, verifyEmail, login, refresh, logout, getMe, updateProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.post('/register', register);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);

router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, upload.single('avatar'), updateProfile);

module.exports = router;
