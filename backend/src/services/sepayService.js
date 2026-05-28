/**
 * SePay Service
 *
 * Xử lý:
 * - Tạo URL mã QR thanh toán SePay
 * - Xác thực API key từ webhook
 * - Trích xuất orderCode từ nội dung chuyển khoản
 * - Tra cứu giao dịch qua SePay API
 */

const axios = require('axios');

const SEPAY_API_KEY     = process.env.SEPAY_API_KEY;
const BANK_CODE         = process.env.SEPAY_BANK_CODE        || 'MB';
const ACCOUNT_NUMBER    = process.env.SEPAY_ACCOUNT_NUMBER   || '0366585487';
const ACCOUNT_NAME      = process.env.SEPAY_ACCOUNT_NAME     || 'NGO DINH NHAT MINH';

// ─── QR Generation ────────────────────────────────────────────────────────────

/**
 * Tạo URL ảnh QR qua SePay
 * Format nội dung chuyển khoản: PAY_ORDER_<orderCode>
 *
 * @param {string} orderCode  - Mã đơn hàng (ORDER_<timestamp>_<rand>)
 * @param {number} amount     - Số tiền (VND)
 * @returns {{ qrUrl, transferContent, accountNumber, accountName, bankCode, amount }}
 */
const generateQRCodeUrl = (orderCode, amount) => {
  const transferContent = `PAY_ORDER_${orderCode}`;
  const roundedAmount   = Math.round(amount);

  const params = new URLSearchParams({
    bank:        BANK_CODE,
    acc:         ACCOUNT_NUMBER,
    template:    'compact',
    amount:      roundedAmount,
    des:         transferContent,
    accountName: ACCOUNT_NAME,
  });

  const qrUrl = `https://qr.sepay.vn/img?${params.toString()}`;

  return {
    qrUrl,
    transferContent,
    accountNumber: ACCOUNT_NUMBER,
    accountName:   ACCOUNT_NAME,
    bankCode:      BANK_CODE,
    amount:        roundedAmount,
  };
};

// ─── Webhook Security ─────────────────────────────────────────────────────────

/**
 * Xác thực API key từ header webhook của SePay
 * SePay gửi: Authorization: Apikey <SEPAY_API_KEY>
 *
 * @param {string} authorizationHeader
 * @returns {boolean}
 */
const verifyWebhookApiKey = (authorizationHeader) => {
  if (!SEPAY_API_KEY) {
    console.warn('[SePay] ⚠️  SEPAY_API_KEY chưa được cấu hình — bỏ qua xác thực webhook');
    return true;
  }

  const received = authorizationHeader?.replace(/^Apikey\s+/i, '').trim();
  const isValid  = received === SEPAY_API_KEY;

  if (!isValid) {
    console.error(`[SePay] ❌ API key không hợp lệ. Received: "${received?.slice(0, 8)}..."`);
  }

  return isValid;
};

// ─── Transfer Content Parser ───────────────────────────────────────────────────

/**
 * Trích xuất orderCode từ nội dung chuyển khoản
 *
 * Hỗ trợ các định dạng ngân hàng có thể gửi về:
 *   PAY_ORDER_ORDER_1779634284938_289
 *   PAY ORDER ORDER 1779634284938 289   (ngân hàng thay _ bằng dấu cách)
 *
 * @param {string} transactionContent
 * @returns {string|null} orderCode (ví dụ: "ORDER_1779634284938_289") hoặc null
 */
const extractOrderCode = (transactionContent) => {
  if (!transactionContent) return null;

  // Chuẩn hóa: uppercase + trim, nhưng GIỮ NGUYÊN khoảng trắng (xử lý sau)
  const upper = transactionContent.toUpperCase().trim();

  // ── Format 1: Ngân hàng giữ nguyên dấu gạch dưới ─────────────────────────
  // Ví dụ: "PAY_ORDER_ORDER_1779968182646_366-CHUYEN TIEN"
  // Hoặc:  "PAY ORDER ORDER 1779968182646 366" (khoảng trắng thay dấu _)
  const normalized = upper.replace(/\s+/g, '_');
  const matchUnderscore =
    normalized.match(/PAY_ORDER_(ORDER_\d+_\d+)/) ||   // PAY_ORDER_ORDER_ts_rand
    normalized.match(/PAY_ORDER_(ORDER_[A-Z0-9_]+)/);  // PAY_ORDER_ORDER_...

  if (matchUnderscore) {
    console.log(`[SePay] ✅ Format dấu gạch dưới — orderCode: ${matchUnderscore[1]}`);
    return matchUnderscore[1];
  }

  // ── Format 2: Ngân hàng XÓA TOÀN BỘ dấu gạch dưới ───────────────────────
  // Ví dụ: "131047092510-PAYORDERORDER1779968182646366-CHUYEN TIEN-..."
  // Cần reconstruct: PAYORDERORDER<timestamp13><rand> → ORDER_<timestamp13>_<rand>
  //
  // Mã đơn hàng gốc: ORDER_<13 chữ số timestamp>_<rand 1-4 chữ số>
  // Sau khi xóa _:   ORDERORDER<13 chữ số><rand>
  // Prefix từ QR:    PAY + ORDER + ORDER = PAYORDERORDER
  //
  // Regex: PAYORDERORDER + (13 chữ số timestamp) + (1-6 chữ số rand)
  const noUnderscoreStr = upper.replace(/[\s\-]/g, ''); // bỏ khoảng trắng và dấu gạch ngang
  const matchNoUnderscore = noUnderscoreStr.match(/PAYORDERORDER(\d{13})(\d{1,6})/);

  if (matchNoUnderscore) {
    const orderCode = `ORDER_${matchNoUnderscore[1]}_${matchNoUnderscore[2]}`;
    console.log(`[SePay] ✅ Format không dấu gạch dưới — orderCode: ${orderCode}`);
    return orderCode;
  }

  // ── Format 3: Chỉ có ORDER_ts_rand không kèm prefix ─────────────────────
  const matchDirect = normalized.match(/(ORDER_\d+_\d+)/);
  if (matchDirect) {
    console.log(`[SePay] ✅ Format trực tiếp — orderCode: ${matchDirect[1]}`);
    return matchDirect[1];
  }

  console.warn(`[SePay] ⚠️  Không tìm thấy orderCode trong: "${transactionContent}"`);
  return null;
};


// ─── SePay API Verification (Optional) ───────────────────────────────────────

/**
 * Tra cứu lại giao dịch qua SePay API (double-check)
 * Dùng khi cần verify thêm ngoài webhook
 *
 * @param {string} referenceNumber  - Mã tham chiếu giao dịch từ SePay
 * @returns {object|null}
 */
const verifyTransactionViaSepayAPI = async (referenceNumber) => {
  if (!SEPAY_API_KEY) {
    console.warn('[SePay] Không có API key — bỏ qua tra cứu API');
    return null;
  }
  if (!referenceNumber) return null;

  try {
    const response = await axios.get('https://my.sepay.vn/userapi/transactions/list', {
      headers: {
        Authorization:  `Bearer ${SEPAY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      params: {
        reference_number: referenceNumber,
        limit:            1,
      },
      timeout: 6000,
    });

    const transactions = response.data?.transactions || [];
    const txn          = transactions[0] || null;

    if (txn) {
      console.log(`[SePay] 🔍 Giao dịch tìm thấy qua API: ${txn.id}`);
    }

    return txn;
  } catch (err) {
    // Không throw — đây chỉ là bước verify phụ
    console.error('[SePay] API verification lỗi:', err.message);
    return null;
  }
};

// ─── Validate Payload ─────────────────────────────────────────────────────────

/**
 * Validate webhook payload từ SePay
 * @param {object} body - Request body từ webhook
 * @returns {{ valid: boolean, reason?: string }}
 */
const validateWebhookPayload = (body) => {
  if (!body || typeof body !== 'object') {
    return { valid: false, reason: 'Empty payload' };
  }

  const amount = body.transferAmount || body.amountIn || body.amount;
  const content = body.transactionContent || body.content || body.transferContent;

  if (!amount || Number(amount) <= 0) {
    return { valid: false, reason: 'Not a deposit transaction (invalid or zero amount)' };
  }

  if (!content || typeof content !== 'string') {
    return { valid: false, reason: 'Missing transactionContent or equivalent text field' };
  }

  return { valid: true };
};

module.exports = {
  generateQRCodeUrl,
  verifyWebhookApiKey,
  extractOrderCode,
  verifyTransactionViaSepayAPI,
  validateWebhookPayload,
};
