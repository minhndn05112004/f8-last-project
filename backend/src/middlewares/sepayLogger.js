/**
 * Middleware: logSePayWebhook
 *
 * Ghi log mỗi lần SePay gọi webhook về server.
 * Log bao gồm: timestamp, số tiền (transferAmount), mã đơn hàng (code / content).
 *
 * Middleware này KHÔNG chặn request — nó chỉ ghi log rồi gọi next().
 */
const logSePayWebhook = (req, res, next) => {
  // ─── Trích xuất các trường cần log từ body ────────────────────────────────
  const {
    transferAmount, // số tiền chuyển khoản
    code,           // mã đơn hàng (SePay có thể điền sẵn từ nội dung CK)
    content,        // nội dung chuyển khoản đầy đủ
    gateway,        // tên ngân hàng / cổng
    referenceCode,  // mã tham chiếu giao dịch
  } = req.body || {};

  // ─── Timestamp theo múi giờ Việt Nam ──────────────────────────────────────
  const timestamp = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
  });

  // ─── In log ra console (stdout) ───────────────────────────────────────────
  console.log('════════════════════════════════════════════════════════');
  console.log(`[SePay Webhook] 📩 Nhận được lúc : ${timestamp}`);
  console.log(`[SePay Webhook] 💰 Số tiền        : ${transferAmount ?? 'N/A'} VND`);
  console.log(`[SePay Webhook] 🔑 Mã đơn hàng   : ${code || '(chưa có — sẽ parse từ content)'}`);
  console.log(`[SePay Webhook] 📝 Nội dung CK    : ${content ?? 'N/A'}`);
  console.log(`[SePay Webhook] 🏦 Gateway        : ${gateway ?? 'N/A'}`);
  console.log(`[SePay Webhook] 🔖 Reference      : ${referenceCode ?? 'N/A'}`);
  console.log('────────────────────────────────────────────────────────');

  // Tiếp tục xử lý request
  next();
};

module.exports = { logSePayWebhook };
