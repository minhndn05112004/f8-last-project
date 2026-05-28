const nodemailer = require('nodemailer');

// Debug: kiểm tra credentials có được load đúng không
console.log('[Mail] GMAIL_USER:', process.env.GMAIL_USER);
console.log('[Mail] GMAIL_APP_PASSWORD loaded:', !!process.env.GMAIL_APP_PASSWORD);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
    console.log('[Mail] Sending verification email to:', toEmail);

    const info = await transporter.sendMail({
      from: `"Anthony Shop" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: 'Verify your email - Anthony Shop',
      html: htmlContent,
    });

    console.log('[Mail] Verification email sent successfully, id:', info.messageId);
    return true;
  } catch (err) {
    console.error('[Mail Error] Exception thrown:', JSON.stringify(err, null, 2));
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
};