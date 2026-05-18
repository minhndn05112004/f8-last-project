const nodemailer = require('nodemailer');

// Set up transporter for development. In production, use real SMTP credentials.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER || 'leola.muller31@ethereal.email',
    pass: process.env.SMTP_PASS || 'd1mP6Bv5S5d7yT37Xy', // Provide a mock ethereal account for testing if none is set
  },
});

const sendVerificationEmail = async (toEmail, token) => {
  const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/auth/verify-email?token=${token}`; // Assuming the verify route will be called directly on backend or frontend handles it and calls backend. Wait, usually the email link hits backend directly which then redirects to frontend, OR it hits frontend which calls backend. The requirements say: GET /api/auth/verify-email?token=... and then redirect frontend /login?verified=true. So the link should point to the BACKEND route.

  const backendVerifyLink = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

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
    const info = await transporter.sendMail({
      from: '"Anthony Shop" <no-reply@anthonyshop.com>',
      to: toEmail,
      subject: 'Verify your email - Anthony Shop',
      html: htmlContent,
    });
    console.log('Verification email sent: %s', info.messageId);
    
    // If using Ethereal, log the preview URL
    if (transporter.options.host === 'smtp.ethereal.email') {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
};
