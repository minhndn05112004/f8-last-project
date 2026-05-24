const router = require('express').Router();
const { getPaymentQR, handleSePayWebhook } = require('../controllers/paymentController');
const { authenticateToken } = require('../middlewares/auth');

// ─── Public — SePay gọi về server ────────────────────────────────────────────
// POST /api/payment/sepay/webhook
router.post('/sepay/webhook', handleSePayWebhook);

// ─── Protected — Frontend lấy QR ─────────────────────────────────────────────
// GET /api/payment/qr/:orderCode
router.get('/qr/:orderCode', authenticateToken, getPaymentQR);

module.exports = router;
