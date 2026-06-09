'use strict';

/**
 * Unit tests cho verifyEmail controller
 *
 * Các case được test:
 *  1. Token hợp lệ          → redirect /login?verified=true
 *  2. Token không tồn tại   → redirect /login?error=invalid_token
 *  3. Token hết hạn         → redirect /login?error=token_expired
 *  4. Không có token        → redirect /login?error=invalid_token
 *  5. Lỗi DB (throw)        → gọi next(err)
 */

// ─── Mock Prisma ─────────────────────────────────────────────────────────────
jest.mock('../src/config/prisma', () => ({
  user: {
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
}));

// ─── Mock mail service ────────────────────────────────────────────────────────
jest.mock('../src/services/mail.service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));

// ─── Import sau khi mock ──────────────────────────────────────────────────────
const prisma = require('../src/config/prisma');
const { verifyEmail } = require('../src/controllers/authController');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeReq = (query = {}) => ({ query });

const makeRes = () => {
  const res = {};
  res.redirect = jest.fn().mockReturnValue(res);
  res.status  = jest.fn().mockReturnValue(res);
  res.json    = jest.fn().mockReturnValue(res);
  return res;
};

const FRONTEND = 'http://localhost:5173';

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('verifyEmail controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = FRONTEND;
  });

  // ── Case 1 ──────────────────────────────────────────────────────────────────
  test('✅ Token hợp lệ → redirect /login?verified=true', async () => {
    const req  = makeReq({ token: 'valid-uuid-token' });
    const res  = makeRes();
    const next = jest.fn();

    const futureExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      verifyToken: 'valid-uuid-token',
      verifyTokenExpiry: futureExpiry,
    });
    prisma.user.update.mockResolvedValue({ id: 1, isVerified: true });

    await verifyEmail(req, res, next);

    // Tìm đúng token
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { verifyToken: 'valid-uuid-token' },
    });
    // Update đúng fields
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isVerified: true, verifyToken: null, verifyTokenExpiry: null },
    });
    // Redirect đúng URL
    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND}/login?verified=true`);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Case 2 ──────────────────────────────────────────────────────────────────
  test('❌ Token không tồn tại → redirect /login?error=invalid_token', async () => {
    const req  = makeReq({ token: 'non-existent-token' });
    const res  = makeRes();
    const next = jest.fn();

    prisma.user.findFirst.mockResolvedValue(null); // Không tìm thấy user

    await verifyEmail(req, res, next);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { verifyToken: 'non-existent-token' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND}/login?error=invalid_token`);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Case 3 ──────────────────────────────────────────────────────────────────
  test('⏰ Token hết hạn → redirect /login?error=token_expired', async () => {
    const req  = makeReq({ token: 'expired-token-abc' });
    const res  = makeRes();
    const next = jest.fn();

    const pastExpiry = new Date(Date.now() - 60 * 1000); // 1 phút trước
    prisma.user.findFirst.mockResolvedValue({
      id: 2,
      email: 'user2@example.com',
      verifyToken: 'expired-token-abc',
      verifyTokenExpiry: pastExpiry,
    });

    await verifyEmail(req, res, next);

    expect(prisma.user.findFirst).toHaveBeenCalled();
    // Không được update khi token hết hạn
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND}/login?error=token_expired`);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Case 4 ──────────────────────────────────────────────────────────────────
  test('🚫 Không có token → redirect /login?error=invalid_token (không query DB)', async () => {
    const req  = makeReq({}); // Không có token
    const res  = makeRes();
    const next = jest.fn();

    await verifyEmail(req, res, next);

    // Không được query DB
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(`${FRONTEND}/login?error=invalid_token`);
    expect(next).not.toHaveBeenCalled();
  });

  // ── Case 5 ──────────────────────────────────────────────────────────────────
  test('💥 Lỗi DB → gọi next(err)', async () => {
    const req  = makeReq({ token: 'any-token' });
    const res  = makeRes();
    const next = jest.fn();

    const dbError = new Error('DB connection failed');
    prisma.user.findFirst.mockRejectedValue(dbError);

    await verifyEmail(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
