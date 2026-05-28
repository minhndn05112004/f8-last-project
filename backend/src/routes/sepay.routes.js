/**
 * Route: SePay Webhook
 *
 * Endpoint duy nhất trong file này:
 *   POST /api/payment/sepay-webhook
 *
 * Luồng xử lý:
 *   1. logSePayWebhook  → ghi log timestamp/amount/code ra console
 *   2. verifySePayToken → kiểm tra header Authorization: Apikey <SEPAY_API_TOKEN>
 *   3. handleSePayWebhook → xử lý payload, cập nhật đơn hàng, ghi PaymentTransaction
 */

const router  = require('express').Router();
const prisma  = require('../config/prisma');
const { logSePayWebhook }  = require('../middlewares/sepayLogger');

// ─── Middleware: Xác thực API token của SePay ──────────────────────────────────
/**
 * SePay gửi header:  Authorization: Apikey <token>
 * Token phải khớp với biến môi trường SEPAY_API_TOKEN.
 *
 * Nếu SEPAY_API_TOKEN chưa được cấu hình, middleware bỏ qua xác thực
 * và in cảnh báo để dev biết cần cấu hình trước khi lên production.
 */
const verifySePayToken = (req, res, next) => {
  const expectedToken = process.env.SEPAY_API_TOKEN;

  // Cảnh báo nếu chưa cấu hình (môi trường dev)
  if (!expectedToken) {
    console.warn('[SePay Webhook] ⚠️  SEPAY_API_TOKEN chưa được cấu hình — bỏ qua xác thực (chỉ dùng cho dev)');
    return next();
  }

  // Đọc header Authorization
  const authHeader = req.headers['authorization'] || '';

  // Tách token khỏi prefix "Apikey " (không phân biệt hoa thường)
  const receivedToken = authHeader.replace(/^Apikey\s+/i, '').trim();

  if (receivedToken !== expectedToken) {
    console.warn(`[SePay Webhook] ❌ Xác thực thất bại. Token nhận được: "${receivedToken.slice(0, 8)}..."`);
    // Trả về 401 nếu xác thực thất bại
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Xác thực thành công
  console.log('[SePay Webhook] ✅ Xác thực API token thành công');
  next();
};

// ─── Controller: Xử lý webhook payload ────────────────────────────────────────
/**
 * Nhận payload JSON từ SePay, trích xuất orderCode,
 * cập nhật trạng thái đơn hàng thành PAID và ghi log giao dịch.
 *
 * Quan trọng: Luôn trả về HTTP 200 { success: true } kể cả khi không
 * tìm thấy đơn hàng — để SePay không retry liên tục.
 * Chỉ trả về 401 nếu xác thực thất bại (đã bị chặn trước bởi middleware).
 */
const handleSePayWebhook = async (req, res) => {
  try {
    // ── Bước 1: Trích xuất các trường từ payload SePay ───────────────────────
    const {
      id,              // ID giao dịch nội bộ của SePay
      gateway,         // Tên ngân hàng / cổng
      transactionDate, // Ngày giao dịch
      accountNumber,   // Số tài khoản nhận tiền
      code,            // Mã đơn hàng (SePay tự parse từ nội dung CK nếu cấu hình đúng)
      content,         // Nội dung chuyển khoản đầy đủ
      transferType,    // "in" = nhận tiền vào
      transferAmount,  // Số tiền
      accumulated,     // Số dư lũy kế
      referenceCode,   // Mã tham chiếu giao dịch
      description,     // Mô tả bổ sung
    } = req.body || {};

    // ── Bước 2: Chỉ xử lý giao dịch tiền vào (transferType = "in") ───────────
    if (transferType && transferType !== 'in') {
      console.log(`[SePay Webhook] ⏭  Bỏ qua giao dịch loại: ${transferType}`);
      return res.json({ success: true, message: 'Skipped non-inbound transaction' });
    }

    // ── Bước 3: Parse mã đơn hàng từ "code" hoặc "content" ──────────────────
    // Ưu tiên trường "code" (SePay điền sẵn), fallback sang parse "content"
    let orderCode = null;

    if (code && typeof code === 'string' && code.trim()) {
      // SePay đã parse sẵn mã đơn hàng vào trường "code"
      orderCode = code.trim();
      console.log(`[SePay Webhook] 🔑 Dùng trường "code": ${orderCode}`);
    } else if (content && typeof content === 'string') {
      // Tự parse từ nội dung chuyển khoản
      // Chuẩn hóa: uppercase, bỏ dấu - và khoảng trắng để match chuỗi liền
      const upper      = content.toUpperCase().trim();
      const normalized = upper.replace(/\s+/g, '_');

      // ── Ưu tiên 1: Format có dấu gạch dưới ─────────────────────────────────
      // "PAY_ORDER_ORDER_1779968866300_426" hoặc dùng khoảng trắng thay _
      const matchUnderscore =
        normalized.match(/PAY_ORDER_(ORDER_\d+_\d+)/) ||
        normalized.match(/PAY_ORDER_(ORDER_[A-Z0-9_]+)/);

      if (matchUnderscore) {
        orderCode = matchUnderscore[1];
        console.log(`[SePay Webhook] 🔑 Parse từ "content" (format _): ${orderCode}`);
      } else {
        // ── Ưu tiên 2: Ngân hàng xóa toàn bộ dấu _ ──────────────────────────
        // "131048678869-PAYORDERORDER1779968866300426-CHUYEN TIEN-..."
        // digits = "1779968866300426" → slice(-3) = "426" → ORDER_1779968866300_426
        const noSeparator = upper.replace(/[\s\-]/g, '');
        const matchRaw    = noSeparator.match(/PAYORDERORDER(\d+)/);

        if (matchRaw) {
          const digits = matchRaw[1];
          orderCode    = 'ORDER_' + digits.slice(0, -3) + '_' + digits.slice(-3);
          console.log(`[SePay Webhook] 🔑 Parse từ "content" (no-underscore): digits=${digits} → ${orderCode}`);
        } else {
          // ── Fallback: ORDER_ts_rand trực tiếp trong chuỗi ───────────────────
          const matchDirect = normalized.match(/(ORDER_\d+_\d+)/);
          if (matchDirect) {
            orderCode = matchDirect[1];
            console.log(`[SePay Webhook] 🔑 Parse từ "content" (direct): ${orderCode}`);
          }
        }
      }
    }


    // ── Bước 4: Không tìm thấy orderCode → vẫn trả 200 để SePay không retry ──
    if (!orderCode) {
      console.warn(`[SePay Webhook] ⚠️  Không tìm thấy mã đơn hàng trong payload. Content: "${content}"`);
      return res.json({ success: true, message: 'Order code not found in content — logged and ignored' });
    }

    const receivedAmount = Number(transferAmount) || 0;
    // ID duy nhất để kiểm tra trùng lặp (idempotency)
    const transactionId  = id?.toString() || referenceCode || null;

    // ── Bước 5: Idempotency — kiểm tra giao dịch đã xử lý chưa ──────────────
    if (transactionId) {
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId },
      });

      if (existingTx) {
        console.log(`[SePay Webhook] ♻️  Giao dịch ${transactionId} đã xử lý trước đó — bỏ qua (idempotency)`);
        return res.json({ success: true, message: 'Transaction already processed' });
      }
    }

    // ── Bước 6: Tìm đơn hàng trong database ──────────────────────────────────
    const order = await prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      // Không tìm thấy đơn hàng → vẫn trả 200 để SePay không retry
      console.warn(`[SePay Webhook] ⚠️  Không tìm thấy đơn hàng: ${orderCode}`);
      return res.json({ success: true, message: 'Order not found — logged and ignored' });
    }

    console.log(`[SePay Webhook] 📦 Tìm thấy đơn hàng: ${orderCode} | Trạng thái TT: ${order.paymentStatus}`);

    // ── Bước 7: Idempotency cấp đơn hàng — bỏ qua nếu đã PAID ───────────────
    if (order.paymentStatus === 'PAID') {
      console.log(`[SePay Webhook] ✅ Đơn hàng ${orderCode} đã PAID từ trước — bỏ qua`);
      return res.json({ success: true, message: 'Order already paid' });
    }

    // ── Bước 8: Cập nhật đơn hàng & ghi PaymentTransaction (atomic) ──────────
    const result = await prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái đơn hàng thành PAID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',       // đã thanh toán
          orderStatus:   'PROCESSING', // chuyển sang xử lý
          paidAt:        new Date(),   // ghi nhận thời điểm thanh toán
        },
      });

      // Ghi log giao dịch vào bảng PaymentTransaction
      const paymentTx = await tx.paymentTransaction.create({
        data: {
          orderId:       order.id,
          // Dùng ID SePay hoặc referenceCode để đảm bảo idempotency sau này
          transactionId: transactionId || `SEPAY_${Date.now()}`,
          amount:        receivedAmount,
          gateway:       gateway || 'N/A',
          content:       content  || code || '',
          // Lưu toàn bộ raw payload để debug hoặc audit sau
          rawData:       JSON.stringify(req.body),
        },
      });

      return { updatedOrder, paymentTx };
    });

    console.log(`[SePay Webhook] ✅ Đơn hàng ${orderCode} → PAID & PROCESSING`);
    console.log(`[SePay Webhook]    Gateway: ${gateway} | Amount: ${receivedAmount} VND | TxID: ${transactionId}`);

    // ── Bước 9: Emit socket realtime (nếu có io) ─────────────────────────────
    const io = req.app.get('io');
    if (io) {
      // Thông báo đến trình duyệt của khách hàng
      io.to(`user_${order.userId}`).emit('payment_success', {
        orderCode:     order.orderCode,
        paymentStatus: 'PAID',
      });

      // Thông báo đến staff/admin dashboard
      io.to('staff_dashboard').emit('order_updated', {
        orderCode:     order.orderCode,
        paymentStatus: 'PAID',
        amount:        receivedAmount,
      });

      console.log(`[SePay Webhook] 📡 Đã emit socket đến user_${order.userId} & staff_dashboard`);
    }

    console.log('[SePay Webhook] ════════════════════════════════════════\n');

    // ── Bước 10: Luôn trả về 200 để SePay không retry ─────────────────────
    return res.json({ success: true });

  } catch (err) {
    // Lỗi server nội bộ — log lại nhưng VẪN trả 200 để SePay không retry
    console.error('[SePay Webhook] ❌ Lỗi server:', err.message || err);
    // Trả về 200 thay vì 500 để tránh SePay retry flood
    return res.json({ success: true });
  }
};

// ─── Đăng ký route ─────────────────────────────────────────────────────────────
// POST /api/payment/sepay-webhook
// Thứ tự middleware: log → xác thực token → xử lý
router.post('/sepay-webhook', logSePayWebhook, verifySePayToken, handleSePayWebhook);

module.exports = router;
