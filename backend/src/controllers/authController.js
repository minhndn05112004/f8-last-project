const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const { sendVerificationEmail } = require('../services/mail.service');

// ─── Validation Schemas ─────────────────────────────────────────────────────

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Token Helper ────────────────────────────────────────────────────────────

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const sanitizeUser = (user) => {
  const { password, verifyToken, refreshToken, refreshTokenExpiry, ...rest } = user;
  return rest;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const register = async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return errorResponse(res, 'Email is already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const verifyToken = crypto.randomUUID();
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        address: data.address,
        isVerified: false,
        verifyToken,
        verifyTokenExpiry,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, verifyToken);
    if (!emailSent) {
      console.error('[Register] Failed to send verification email to:', user.email);
      // Vẫn tạo user thành công, nhưng báo lỗi gửi mail
      return successResponse(
        res,
        null,
        'Registration successful but failed to send verification email. Please use resend verification.',
        201
      );
    }

    return successResponse(
      res,
      null, // Don't return user/token, force them to verify email first
      'Registration successful. Please check your email to verify your account.',
      201
    );
  } catch (err) {
    next(err);
  }
};

const verifyEmail = async (req, res, next) => {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const { token } = req.query;
    if (!token) {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_token`);
    }

    const user = await prisma.user.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      return res.redirect(`${FRONTEND_URL}/login?error=invalid_token`);
    }

    // Kiểm tra token có hết hạn chưa
    if (user.verifyTokenExpiry && user.verifyTokenExpiry < new Date()) {
      return res.redirect(`${FRONTEND_URL}/login?error=token_expired`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    return res.redirect(`${FRONTEND_URL}/login?verified=true`);
  } catch (err) {
    next(err);
  }
};

const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 'Email is required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.isVerified) {
      return errorResponse(res, 'Account is already verified', 400);
    }

    const verifyToken = crypto.randomUUID();
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 giờ

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExpiry },
    });

    const emailSent = await sendVerificationEmail(user.email, verifyToken);
    if (!emailSent) {
      return errorResponse(res, 'Failed to send verification email. Please try again later.', 500);
    }

    return successResponse(res, null, 'Verification email resent successfully');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated', 403);
    }

    if (!user.isVerified) {
      return errorResponse(res, 'Please verify your email before logging in', 403);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Save refresh token to DB
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken,
        refreshTokenExpiry: expiryDate,
      },
    });

    return successResponse(res, { user: sanitizeUser(user), accessToken, refreshToken }, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required', 401);
    }

    // Verify token structure and expiry
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== refreshToken || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      return errorResponse(res, 'Invalid or expired refresh token', 401);
    }

    const accessToken = generateAccessToken(user);
    // Optionally rotate the refresh token here, but we'll stick to simple access token generation for now

    return successResponse(res, { accessToken }, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    // Attempt to get user from token via middleware if possible,
    // Or from the body if they pass the refresh token
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await prisma.user.updateMany({
        where: { refreshToken },
        data: {
          refreshToken: null,
          refreshTokenExpiry: null,
        },
      });
    }

    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        address: true,
        role: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, user);
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, address } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (req.file) updateData.avatar = `/${req.file.path.replace(/\\\\/g, '/')}`;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true, fullName: true, email: true,
        phone: true, avatar: true, address: true,
        role: true, createdAt: true, updatedAt: true,
      },
    });

    return successResponse(res, user, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { register, verifyEmail, resendVerification, login, refresh, logout, getMe, updateProfile };
