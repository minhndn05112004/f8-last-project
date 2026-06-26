const { z } = require('zod');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');
const cloudinary = require('../config/cloudinary');

const employeeSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['STAFF', 'SHIPPER'], { errorMap: () => ({ message: 'Role must be STAFF or SHIPPER' }) }),
  branch: z.enum(['Hà Nội', 'Đà Nẵng', 'TP. Hồ Chí Minh'], { errorMap: () => ({ message: 'Branch must be Hà Nội, Đà Nẵng, or TP. Hồ Chí Minh' }) }),
});

const createEmployee = async (req, res, next) => {
  try {
    const data = employeeSchema.parse(req.body);

    // Check if username already exists in either username or email field
    const derivedEmail = `${data.username.toLowerCase()}@meatshop.vn`;
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: derivedEmail }
        ]
      }
    });

    if (existingUser) {
      return errorResponse(res, 'Username already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const employee = await prisma.user.create({
      data: {
        fullName: data.fullName,
        email: derivedEmail,
        username: data.username,
        password: hashedPassword,
        role: data.role,
        branch: data.branch,
        isVerified: true,
        isActive: true,
      }
    });

    // Sanitize password before response
    const { password, ...sanitizedEmployee } = employee;

    return successResponse(res, sanitizedEmployee, 'Employee created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ['STAFF', 'SHIPPER']
        }
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        username: true,
        role: true,
        branch: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return successResponse(res, employees, 'Employees retrieved successfully');
  } catch (err) {
    next(err);
  }
};

const checkCloudinary = async (req, res, next) => {
  try {
    const cfg = cloudinary.config();
    const secret = process.env.CLOUDINARY_API_SECRET || '';
    // Attempt a real authenticated API call — fails immediately if secret is wrong
    await cloudinary.api.ping();
    return successResponse(res, {
      cloud_name: cfg.cloud_name,
      api_key: cfg.api_key,
      api_secret_length: secret.length,
      api_secret_prefix: secret.substring(0, 8),
      status: 'credentials_valid',
    }, 'Cloudinary credentials are valid ✅');
  } catch (err) {
    const secret = process.env.CLOUDINARY_API_SECRET || '';
    return res.status(500).json({
      success: false,
      message: 'Cloudinary credential check FAILED ❌',
      error: err.message,
      api_secret_length: secret.length,
      api_secret_prefix: secret.substring(0, 8),
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  checkCloudinary,
};
