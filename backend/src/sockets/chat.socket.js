const prisma = require('../config/prisma');

/**
 * Advanced Customer Support Chat Socket Handler
 */
const setupChatSocket = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    console.log(`🔌 Chat socket connected: ${socket.id}`);

    // ── Handle Authentication & Online Status ────────────────────────────────
    socket.on('authenticate', async ({ userId, role }) => {
      if (!userId) return;
      
      socket.userId = parseInt(userId);
      socket.role = role;
      
      try {
        await prisma.user.update({
          where: { id: socket.userId },
          data: { isOnline: true }
        });
        
        console.log(`👤 User ${socket.userId} (${role}) authenticated`);
        
        if (role === 'STAFF' || role === 'ADMIN') {
          socket.join('staff_room');
          console.log(`🏰 Staff ${socket.userId} joined staff_room`);
        }
      } catch (err) {
        console.error('Authentication update error:', err);
      }
    });

    // ── USER: Request Support ────────────────────────────────────────────────
    socket.on('request_support', async ({ userId }) => {
      console.log(`🙋 Support requested by user: ${userId}`);
      try {
        const uid = parseInt(userId);
        
        let request = await prisma.supportRequest.findFirst({
          where: {
            userId: uid,
            status: { in: ['WAITING', 'ACTIVE'] }
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

        if (!request) {
          console.log(`🆕 Creating new support request for user: ${uid}`);
          request = await prisma.supportRequest.create({
            data: { userId: uid, status: 'WAITING' },
            include: {
              user: { select: { id: true, fullName: true, avatar: true } }
            }
          });
          
          console.log(`📢 Broadcasting new_support_request to staff_room`);
          chatNamespace.to('staff_room').emit('new_support_request', request);
        }

        socket.join(`support_${request.id}`);
        socket.emit('support_request_status', request);
      } catch (err) {
        console.error('request_support error:', err);
        socket.emit('error', { message: 'Failed to request support' });
      }
    });

    // ── STAFF: Get Pending Requests ──────────────────────────────────────────
    socket.on('get_pending_requests', async () => {
      console.log(`📋 Staff requested pending requests list`);
      try {
        const requests = await prisma.supportRequest.findMany({
          where: { status: 'WAITING' },
          include: { user: { select: { id: true, fullName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' }
        });
        console.log(`📦 Found ${requests.length} pending requests`);
        socket.emit('pending_requests', requests);
      } catch (err) {
        console.error('get_pending_requests error:', err);
      }
    });

    // ── STAFF: Accept Support Request ────────────────────────────────────────
    socket.on('accept_support_request', async ({ requestId, staffId }) => {
      console.log(`🤝 Staff ${staffId} accepting request ${requestId}`);
      try {
        const rid = parseInt(requestId);
        const sid = parseInt(staffId);

        const existing = await prisma.supportRequest.findUnique({ where: { id: rid } });
        if (!existing || existing.status !== 'WAITING') {
          socket.emit('error', { message: 'Request already accepted or closed' });
          return;
        }

        const request = await prisma.supportRequest.update({
          where: { id: rid },
          data: { assignedStaffId: sid, status: 'ACTIVE' },
          include: {
            user: { select: { id: true, fullName: true, avatar: true } },
            assignedStaff: { select: { id: true, fullName: true, avatar: true } },
            messages: {
              include: { sender: { select: { id: true, fullName: true, role: true } } },
              orderBy: { createdAt: 'asc' }
            }
          }
        });

        socket.join(`support_${rid}`);
        chatNamespace.to(`support_${rid}`).emit('support_request_accepted', request);
        chatNamespace.to('staff_room').emit('support_request_handled', { requestId: rid });
        console.log(`✅ Request ${rid} is now ACTIVE and assigned to ${sid}`);
      } catch (err) {
        console.error('accept_support_request error:', err);
      }
    });

    // ── COMMON: Send Message ─────────────────────────────────────────────────
    socket.on('send_message', async ({ requestId, senderId, content }) => {
      try {
        const rid = parseInt(requestId);
        const sid = parseInt(senderId);

        if (!content?.trim()) return;

        const message = await prisma.message.create({
          data: {
            supportRequestId: rid,
            senderId: sid,
            content: content.trim()
          },
          include: {
            sender: { select: { id: true, fullName: true, avatar: true, role: true } }
          }
        });

        chatNamespace.to(`support_${rid}`).emit('receive_message', message);
      } catch (err) {
        console.error('send_message error:', err);
      }
    });

    // ── STAFF: Close Request ─────────────────────────────────────────────────
    socket.on('close_support_request', async ({ requestId }) => {
      try {
        const rid = parseInt(requestId);
        await prisma.supportRequest.update({
          where: { id: rid },
          data: { status: 'CLOSED' }
        });
        chatNamespace.to(`support_${rid}`).emit('support_request_closed', { requestId: rid });
        console.log(`🔒 Request ${rid} CLOSED`);
      } catch (err) {
        console.error('close_support_request error:', err);
      }
    });

    socket.on('disconnect', async () => {
      if (socket.userId) {
        try {
          await prisma.user.update({
            where: { id: socket.userId },
            data: { isOnline: false }
          });
          console.log(`🔌 User ${socket.userId} disconnected`);
        } catch (err) {}
      }
    });
  });
};

module.exports = { setupChatSocket };
