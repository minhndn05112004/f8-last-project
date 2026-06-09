'use strict';

const { Resend } = require('resend');

// ─── Khởi tạo Resend client ────────────────────────────────────────────────
if (!process.env.RESEND_API_KEY) {
  console.warn('[Mail] WARNING: RESEND_API_KEY chưa được cấu hình trong .env!');
}

const resend = new Resend(process.env.RESEND_API_KEY);

// Địa chỉ gửi (cần domain đã verify trên Resend dashboard)
// Mặc định dùng onboarding@resend.dev cho môi trường test
const FROM_ADDRESS =
  process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

console.log('[Mail] Resend initialized. FROM_ADDRESS:', FROM_ADDRESS);

// ─── Hàm gửi email tổng quát ───────────────────────────────────────────────
/**
 * Gửi email qua Resend API
 * @param {{ to: string|string[], subject: string, html: string, from?: string }} options
 * @returns {Promise<boolean>}
 */
const sendEmail = async ({ to, subject, html, from }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: from || FROM_ADDRESS,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error('[Mail Error] Resend trả về lỗi:', error);
      return false;
    }

    console.log('[Mail] Email đã gửi thành công. ID:', data?.id);
    return true;
  } catch (err) {
    console.error('[Mail Error] Gửi email thất bại:');
    console.error('  message:', err.message);
    console.error('  code   :', err.code || 'N/A');
    if (err.stack) {
      console.error('  stack  :', err.stack);
    }
    return false;
  }
};

// ─── Gửi email xác minh tài khoản ─────────────────────────────────────────
/**
 * Gửi email xác minh đến người dùng mới đăng ký
 * @param {string} toEmail  - Địa chỉ email người nhận
 * @param {string} token    - Token xác minh
 * @returns {Promise<boolean>}
 */
const sendVerificationEmail = async (toEmail, token) => {
  const backendVerifyLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #ef4444; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Anthony Shop</h1>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #333333; margin-top: 0;">Welcome to Anthony Shop!</h2>
        <p style="color: #666666; font-size: 16px; line-height: 1.5;">
          Thank you for registering an account with us. We're thrilled to have you!
          To ensure the security of your account and access all our premium meat products, please verify your email address.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${backendVerifyLink}" style="background-color: #ef4444; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block;">Xác nhận Email</a>
        </div>
        <p style="color: #999999; font-size: 14px; margin-bottom: 0;">
          If you did not create this account, you can safely ignore this email.
        </p>
      </div>
      <div style="background-color: #f9f9f9; padding: 15px; text-align: center; border-top: 1px solid #eeeeee;">
        <p style="color: #999999; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Anthony Shop. All rights reserved.</p>
      </div>
    </div>
  `;

  console.log('[Mail] Đang gửi email xác minh qua Resend đến:', toEmail);

  return sendEmail({
    to: toEmail,
    subject: 'Verify your email - Anthony Shop',
    html: htmlContent,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
};