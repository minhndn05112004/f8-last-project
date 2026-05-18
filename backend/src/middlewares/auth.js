const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

/**
 * Middleware: Verify JWT token from Authorization header
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return errorResponse(res, 'Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    return errorResponse(res, 'Invalid or expired token', 401);
  }
};

/**
 * Middleware factory: Restrict access by role
 * Usage: authorizeRoles('ADMIN', 'STAFF')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'You do not have permission to access this resource', 403);
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
