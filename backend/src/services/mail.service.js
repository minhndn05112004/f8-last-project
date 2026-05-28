const axios = require('axios');

// Debug: kiểm tra API key
console.log('[Mail] BREVO_API_KEY loaded:', !!process.env.BREVO_API_KEY);
console.log('[Mail] BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL);

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

  try {
    console.log('[Mail] Sending verification email via Brevo to:', toEmail);

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'Anthony Shop',
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email: toEmail }],
        subject: 'Verify your email - Anthony Shop',
        htmlContent,
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 15000,
      }
    );

    console.log('[Mail] Verification email sent successfully, messageId:', response.data?.messageId);
    return true;
  } catch (err) {
    const errData = err.response?.data;
    console.error('[Mail Error] Brevo send failed:');
    console.error('  status :', err.response?.status);
    console.error('  message:', errData?.message || err.message);
    console.error('  code   :', errData?.code);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
};