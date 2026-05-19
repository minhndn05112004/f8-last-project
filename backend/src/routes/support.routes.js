const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * @route   GET /api/support/waiting
 * @desc    Get all pending support requests (WAITING)
 * @access  Staff/Admin
 */
router.get('/waiting', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const requests = await prisma.supportRequest.findMany({
      where: { status: 'WAITING' },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, requests, 'Successfully retrieved waiting support requests');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/support/active
 * @desc    Get all active support requests assigned to current staff
 * @access  Staff/Admin
 */
router.get('/active', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const requests = await prisma.supportRequest.findMany({
      where: { 
        status: 'ACTIVE',
        assignedStaffId: req.user.id
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true, phone: true } },
        messages: {
          include: { sender: { select: { id: true, fullName: true, role: true, avatar: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return successResponse(res, requests, 'Successfully retrieved active support requests');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/support/history
 * @desc    Get all resolved support requests (COMPLETED/CLOSED)
 * @access  Staff/Admin
 */
router.get('/history', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const requests = await prisma.supportRequest.findMany({
      where: { 
        status: { in: ['COMPLETED', 'CLOSED'] }
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatar: true } },
        assignedStaff: { select: { id: true, fullName: true, email: true, avatar: true } },
        _count: { select: { messages: true } }
      },
      orderBy: { closedAt: 'desc' }
    });
    return successResponse(res, requests, 'Successfully retrieved support history');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/support/:id/messages
 * @desc    Get all messages for a specific support request
 * @access  Authenticated (User involved or Staff/Admin)
 */
router.get('/:id/messages', authenticateToken, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const request = await prisma.supportRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        assignedStaff: { select: { id: true, fullName: true, avatar: true } }
      }
    });

    if (!request) {
      return errorResponse(res, 'Support request not found', 404);
    }

    // Verify ownership: must be the user who requested support or a staff/admin
    if (req.user.role === 'USER' && request.userId !== req.user.id) {
      return errorResponse(res, 'Unauthorized to access these messages', 403);
    }

    const messages = await prisma.message.findMany({
      where: { supportRequestId: id },
      include: {
        sender: { select: { id: true, fullName: true, role: true, avatar: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return successResponse(res, { request, messages }, 'Successfully retrieved support conversation');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/support/:id/accept
 * @desc    Accept a waiting support request
 * @access  Staff/Admin
 */
router.post('/:id/accept', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const staffId = req.user.id;

    const existing = await prisma.supportRequest.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Support request not found', 404);
    }
    if (existing.status !== 'WAITING') {
      return errorResponse(res, 'Request is already active, completed, or closed', 400);
    }

    const request = await prisma.supportRequest.update({
      where: { id },
      data: { 
        assignedStaffId: staffId, 
        status: 'ACTIVE',
        acceptedAt: new Date()
      },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
        assignedStaff: { select: { id: true, fullName: true, avatar: true } },
        messages: {
          include: { sender: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Realtime notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      const chatNamespace = io.of('/chat');
      chatNamespace.to(`support_${id}`).emit('support_request_accepted', request);
      chatNamespace.to('staff_room').emit('support_request_handled', { requestId: id });
    }

    return successResponse(res, request, 'Support request accepted successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/support/:id/complete
 * @desc    Mark an active support request as completed
 * @access  Staff/Admin
 */
router.post('/:id/complete', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.supportRequest.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Support request not found', 404);
    }

    const request = await prisma.supportRequest.update({
      where: { id },
      data: { 
        status: 'COMPLETED',
        closedAt: new Date()
      }
    });

    // Realtime notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      const chatNamespace = io.of('/chat');
      chatNamespace.to(`support_${id}`).emit('support_request_closed', { requestId: id, status: 'COMPLETED' });
      chatNamespace.to('staff_room').emit('support_request_status_changed', { requestId: id, status: 'COMPLETED' });
    }

    return successResponse(res, request, 'Support request completed successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/support/:id/close
 * @desc    Close a support request completely
 * @access  Staff/Admin
 */
router.post('/:id/close', authenticateToken, authorizeRoles('STAFF', 'ADMIN'), async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.supportRequest.findUnique({ where: { id } });
    if (!existing) {
      return errorResponse(res, 'Support request not found', 404);
    }

    const request = await prisma.supportRequest.update({
      where: { id },
      data: { 
        status: 'CLOSED',
        closedAt: new Date()
      }
    });

    // Realtime notification via Socket.io
    const io = req.app.get('io');
    if (io) {
      const chatNamespace = io.of('/chat');
      chatNamespace.to(`support_${id}`).emit('support_request_closed', { requestId: id, status: 'CLOSED' });
      chatNamespace.to('staff_room').emit('support_request_status_changed', { requestId: id, status: 'CLOSED' });
    }

    return successResponse(res, request, 'Support request closed successfully');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
