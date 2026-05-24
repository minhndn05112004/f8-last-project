/**
 * Payment Controller
 *
 * Endpoints:
 *   GET  /api/payment/qr/:orderCode  — Tạo QR SePay cho đơn hàng
 *   POST /api/payment/sepay/webhook  — Nhận webhook từ SePay
 */

const prisma = require('../config/prisma');
const {
  generateQRCodeUrl,
  verifyWebhookApiKey,
  extractOrderCode,
  validateWebhookPayload,
} = require('../services/sepayService');

// ─── GET /api/payment/qr/:orderCode ──────────────────────────────────────────

/**
 * Tạo thông tin thanh toán + URL QR SePay cho đơn hàng
 * Chỉ cho phép chủ đơn hàng truy cập
 */
const getPaymentQR = async (req, res) => {
  try {
    const { orderCode } = req.params;

    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: {
        id:            true,
        orderCode:     true,
        totalAmount:   true,
        paymentStatus: true,
        paymentMethod: true,
        orderStatus:   true,
        createdAt:     true,
        userId:        true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Bảo mật: chỉ cho chủ đơn hàng xem QR
    if (req.user && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập đơn hàng này' });
    }

    // Không phải bank transfer → không cần QR
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      return res.status(400).json({ success: false, message: 'Đơn hàng này không thanh toán qua chuyển khoản' });
    }

    // Đã thanh toán → trả về thông tin mà không kèm QR
    if (order.paymentStatus === 'PAID') {
      return res.json({
        success: true,
        data: { ...order, alreadyPaid: true, qrUrl: null },
      });
    }

    // Tạo QR từ SePay
    const qrData = generateQRCodeUrl(orderCode, order.totalAmount);

    console.log(`[Payment QR] Generated for order ${orderCode}: amount=${qrData.amount}`);

    return res.json({
      success: true,
      data: {
        ...order,
        ...qrData,
        alreadyPaid: false,
      },
    });
  } catch (err) {
    console.error('[Payment QR] Error:', err);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

const handleSePayWebhook = async (req, res) => {
  try {
    console.log("================================")
    console.log("SEPAY WEBHOOK RECEIVED")
    console.log("HEADERS:", req.headers)
    console.log("BODY:", req.body)
    console.log("================================")

    // 1. Xác thực API key từ header
    const authHeader = req.headers['authorization'];
    if (!verifyWebhookApiKey(authHeader)) {
      console.warn('[SePay Webhook] ❌ Unauthorized request');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 2. Validate payload cơ bản
    const { valid, reason } = validateWebhookPayload(req.body);
    if (!valid) {
      console.log(`[SePay Webhook] Skipped: ${reason}`);
      return res.status(400).json({ success: false, message: reason });
    }

    // Trích xuất các trường hỗ trợ cả format của SePay thật và mock
    const id = req.body.id;
    const amount = req.body.transferAmount || req.body.amountIn || req.body.amount;
    const transactionContent = req.body.transactionContent || req.body.content || req.body.transferContent;
    const gateway = req.body.gateway || req.body.bankName || req.body.bank || 'N/A';
    const referenceNumber = req.body.referenceNumber || req.body.referenceCode;

    console.log('[SePay Webhook] Extracted fields:', {
      id,
      amount,
      transactionContent,
      gateway,
      referenceNumber
    });

    const receivedAmount = Number(amount);

    // 3. Trích xuất orderCode từ nội dung chuyển khoản
    const orderCode = extractOrderCode(transactionContent);

    if (!orderCode) {
      console.warn(`[SePay Webhook] ❌ Invalid orderCode or format matching: "${transactionContent}"`);
      return res.status(400).json({
        success: false,
        message: `Không tìm thấy mã đơn hàng hợp lệ trong nội dung: "${transactionContent}"`,
      });
    }

    // 4. Idempotency: Kiểm tra giao dịch trùng lặp
    const transactionId = id?.toString() || referenceNumber;
    if (transactionId) {
      const existingTx = await prisma.paymentTransaction.findUnique({
        where: { transactionId },
      });
      if (existingTx) {
        console.log(`[SePay Webhook] ⚠️ Giao dịch ${transactionId} đã được xử lý từ trước (Idempotency)`);
        return res.json({ success: true, message: 'Transaction already processed' });
      }
    }

    // 5. Tìm đơn hàng
    const order = await prisma.order.findUnique({
      where: { orderCode },
    });

    if (!order) {
      console.warn(`[SePay Webhook] ❌ Đơn hàng không tồn tại: ${orderCode}`);
      return res.status(404).json({ success: false, message: `Không tìm thấy đơn hàng ${orderCode}` });
    }

    console.log('[SePay Webhook] Found order in database:', {
      id: order.id,
      orderCode: order.orderCode,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
    });

    // 6. Kiểm tra số tiền (amountIn phải >= totalAmount)
    if (receivedAmount < order.totalAmount) {
      console.warn(`[SePay Webhook] ❌ Số tiền không đủ. Cần: ${order.totalAmount}, Nhận: ${receivedAmount}`);
      return res.status(400).json({
        success: false,
        message: `Số tiền không đủ. Cần: ${order.totalAmount}đ, Nhận: ${receivedAmount}đ`,
      });
    }

    // 7. Kiểm tra phương thức thanh toán
    if (order.paymentMethod !== 'BANK_TRANSFER') {
      console.warn(`[SePay Webhook] ❌ Đơn hàng ${orderCode} không phải BANK_TRANSFER`);
      return res.status(400).json({ success: false, message: 'Order payment method mismatch' });
    }

    // 8. Idempotency cấp Order: bỏ qua nếu đã thanh toán
    if (order.paymentStatus === 'PAID') {
      console.log(`[SePay Webhook] Đơn hàng ${orderCode} đã PAID trước đó — bỏ qua`);
      return res.json({ success: true, message: 'Order already paid' });
    }

    // 9. Cập nhật Order status & tạo PaymentTransaction trong transaction duy nhất
    const updatedResult = await prisma.$transaction(async (tx) => {
      // Cập nhật order
      const ord = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus:   'PROCESSING',
          paidAt:        new Date(),
        },
      });

      // Tạo transaction record
      const pTx = await tx.paymentTransaction.create({
        data: {
          orderId:       order.id,
          transactionId: transactionId || `SP_MOCK_${Date.now()}`,
          amount:        receivedAmount,
          gateway:       gateway || 'N/A',
          content:       transactionContent,
          rawData:       JSON.stringify(req.body),
        },
      });

      return { order: ord, transaction: pTx };
    });

    console.log('[SePay Webhook] DB Update Successful. Database Result:', JSON.stringify(updatedResult, null, 2));

    console.log(`[SePay Webhook] ✅ Đơn hàng ${orderCode} đã được xác nhận PAID & status = PROCESSING`);
    console.log(`[SePay Webhook]    Gateway: ${gateway} | Amount: ${receivedAmount} | Ref: ${referenceNumber}`);

    // 10. Emit realtime socket
    const io = req.app.get('io');
    if (io) {
      // Gửi đến tab trình duyệt của khách hàng
      io.to(`user_${order.userId}`).emit('payment_success', {
        orderCode:     order.orderCode,
        paymentStatus: 'PAID',
      });

      // Gửi đến staff dashboard
      io.to('staff_dashboard').emit('order_updated', {
        orderCode:     order.orderCode,
        paymentStatus: 'PAID',
        amount:        receivedAmount,
      });

      console.log(`[SePay Webhook] 📡 Emitted payment_success to user_${order.userId}`);
    }

    console.log('[SePay Webhook] ═══════════════════════════════════════\n');

    return res.json({ success: true, message: 'Payment confirmed successfully' });
  } catch (err) {
    console.error('[SePay Webhook] ❌ Error:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { getPaymentQR, handleSePayWebhook };
