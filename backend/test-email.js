'use strict';

// Load biến môi trường từ .env
require('dotenv').config();

const { sendEmail, sendVerificationEmail } = require('./src/services/mail.service');

// ─── Cấu hình test ─────────────────────────────────────────────────────────
// ⚠️  Thay YOUR_EMAIL@gmail.com bằng email bạn muốn nhận thử
const TEST_RECIPIENT = 'ducanhbanche@gmail.com';

// ─── Chạy test ─────────────────────────────────────────────────────────────
async function runTest() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  TEST GỬI EMAIL QUA RESEND SDK');
  console.log('═══════════════════════════════════════════════════');
  console.log('RESEND_API_KEY loaded:', !!process.env.RESEND_API_KEY);
  console.log('RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev');
  console.log('Recipient:', TEST_RECIPIENT);
  console.log('───────────────────────────────────────────────────\n');

  // Test 1: sendEmail tổng quát
  console.log('[Test 1] Gửi email đơn giản via sendEmail()...');
  const result1 = await sendEmail({
    to: TEST_RECIPIENT,
    subject: '✅ Test Resend - Anthony Shop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 2px solid #ef4444; border-radius: 8px;">
        <h2 style="color: #ef4444;">🎉 Resend hoạt động!</h2>
        <p>Email này được gửi thử từ <strong>Anthony Shop Backend</strong>.</p>
        <p>Thời gian gửi: <strong>${new Date().toLocaleString('vi-VN')}</strong></p>
        <hr style="border-color: #eee;" />
        <p style="color: #999; font-size: 12px;">
          Powered by <a href="https://resend.com" style="color: #ef4444;">Resend</a>
        </p>
      </div>
    `,
  });
  console.log('[Test 1] Kết quả:', result1 ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  console.log('\n───────────────────────────────────────────────────');

  // Test 2: sendVerificationEmail
  console.log('[Test 2] Gửi verification email via sendVerificationEmail()...');
  const fakeToken = 'test-token-' + Date.now();
  const result2 = await sendVerificationEmail(TEST_RECIPIENT, fakeToken);
  console.log('[Test 2] Kết quả:', result2 ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  KẾT QUẢ TỔNG HỢP');
  console.log('═══════════════════════════════════════════════════');
  console.log('Test 1 (sendEmail):             ', result1 ? '✅ PASS' : '❌ FAIL');
  console.log('Test 2 (sendVerificationEmail): ', result2 ? '✅ PASS' : '❌ FAIL');

  if (!result1 || !result2) {
    console.log('\n💡 Gợi ý nếu gặp lỗi:');
    console.log('   • Kiểm tra RESEND_API_KEY trong .env có đúng không');
    console.log('   • Đảm bảo FROM_EMAIL đã được verify trên https://resend.com/domains');
    console.log('   • Với onboarding@resend.dev: chỉ gửi được đến email đăng ký Resend account');
    process.exit(1);
  } else {
    console.log('\n🎉 Tất cả test đều PASS! Resend đã được cấu hình đúng.');
    process.exit(0);
  }
}

runTest().catch((err) => {
  console.error('❌ Lỗi không mong đợi:', err);
  process.exit(1);
});
