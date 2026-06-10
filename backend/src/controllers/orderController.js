const { z } = require('zod');
const prisma = require('../config/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDER_STATUS = {
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED:            'CONFIRMED',
  PREPARING:            'PREPARING',
  READY_FOR_DELIVERY:   'READY_FOR_DELIVERY',
  DELIVERING:           'DELIVERING',
  DELIVERED:            'DELIVERED',
  CANCELLED:            'CANCELLED',
};

const PAYMENT_STATUS = {
  PENDING:  'PENDING',
  PAID:     'PAID',
  REFUNDED: 'REFUNDED',
  FAILED:   'FAILED',
};

// State machine: từ trạng thái X, ai được phép chuyển sang Y
const VALID_TRANSITIONS = {
  PENDING_CONFIRMATION: {
    CONFIRMED: ['ADMIN', 'STAFF'],
    CANCELLED: ['ADMIN', 'STAFF'],
  },
  CONFIRMED: {
    PREPARING: ['ADMIN', 'STAFF'],
    CANCELLED: ['ADMIN', 'STAFF'],
  },
  PREPARING: {
    READY_FOR_DELIVERY: ['ADMIN', 'STAFF'],
    CANCELLED: ['ADMIN'],
  },
  READY_FOR_DELIVERY: {
    DELIVERING: ['ADMIN', 'SHIPPER'],
    CANCELLED:  ['ADMIN'],
  },
  DELIVERING: {
    DELIVERED: ['SHIPPER'],
    CANCELLED: ['ADMIN'],
  },
  DELIVERED:  {}, // terminal
  CANCELLED:  {}, // terminal
};

// Timestamp field tự động theo trạng thái đích
const STATUS_TIMESTAMP_FIELD = {
  CONFIRMED:          'confirmedAt',
  PREPARING:          null,
  READY_FOR_DELIVERY: 'preparedAt',
  DELIVERING:         'shippedAt',
  DELIVERED:          'deliveredAt',
  CANCELLED:          'cancelledAt',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (p) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

/**
 * Ghi một bản ghi OrderStatusLog và trả về data update cho Order.
 * Không tự update order — caller tự quyết định trong transaction.
 */
function buildStatusTransitionData(fromStatus, toStatus, extraData = {}) {
  const tsField = STATUS_TIMESTAMP_FIELD[toStatus];
  return {
    orderStatus: toStatus,
    ...(tsField ? { [tsField]: new Date() } : {}),
    ...extraData,
  };
}

async function logStatusChange(tx, { orderId, fromStatus, toStatus, changedById, note }) {
  return tx.orderStatusLog.create({
    data: { orderId, fromStatus: fromStatus || null, toStatus, changedById, note: note || null },
  });
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, 'Cần nhập địa chỉ giao hàng'),
  customerPhone:   z.string().min(9,  'Số điện thoại không hợp lệ'),
  customerEmail:   z.string().email('Email không hợp lệ'),
  note:            z.string().optional(),
  paymentMethod:   z.enum(['CASH', 'BANK_TRANSFER']).default('CASH'),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity:  z.coerce.number().int().positive(),
  })).optional(),
});

// ─── POST /api/orders — đặt hàng ─────────────────────────────────────────────

const createOrder = async (req, res, next) => {
  try {
    const {
      shippingAddress, customerPhone, customerEmail,
      note, paymentMethod, items: directItems,
    } = createOrderSchema.parse(req.body);

    let orderItems;

    if (directItems && directItems.length > 0) {
      orderItems = await Promise.all(
        directItems.map(async ({ productId, quantity }) => {
          const product = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
          if (!product) throw new Error(`Sản phẩm ${productId} không tồn tại`);
          if (product.stock < quantity) throw new Error(`Không đủ hàng: ${product.name}`);
          return { product, quantity };
        })
      );
    } else {
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: { include: { product: true } } },
      });
      if (!cart || !cart.items?.length) return errorResponse(res, 'Giỏ hàng trống', 400);

      const invalid = cart.items.filter((i) => i.product.isDeleted || i.product.stock < i.quantity);
      if (invalid.length) return errorResponse(res, 'Một số sản phẩm đã hết hàng hoặc không còn bán', 400);

      orderItems = cart.items.map(({ product, quantity }) => ({ product, quantity }));
    }

    const totalAmount = orderItems.reduce(
      (sum, { product, quantity }) => sum + (product.salePrice || product.price) * quantity,
      0
    );

    const orderCode = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          orderCode,
          totalAmount,
          shippingAddress,
          customerPhone,
          customerEmail,
          note,
          paymentMethod,
          paymentStatus: PAYMENT_STATUS.PENDING,
          orderStatus:   ORDER_STATUS.PENDING_CONFIRMATION, // luôn bắt đầu ở đây
          orderItems: {
            create: orderItems.map(({ product, quantity }) => ({
              productId: product.id,
              quantity,
              price: product.salePrice || product.price,
            })),
          },
        },
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, thumbnail: true } } } },
        },
      });

      // Log trạng thái khởi tạo (fromStatus = null)
      await logStatusChange(tx, {
        orderId:     newOrder.id,
        fromStatus:  null,
        toStatus:    ORDER_STATUS.PENDING_CONFIRMATION,
        changedById: req.user.id,
        note:        'Đơn hàng được tạo',
      });

      // Cập nhật thông tin user
      await tx.user.update({
        where: { id: req.user.id },
        data: { address: shippingAddress, phone: customerPhone },
      });

      // Trừ tồn kho
      for (const { product, quantity } of orderItems) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: quantity } },
        });
      }

      // Xóa giỏ hàng nếu đặt từ cart
      if (!directItems) {
        const userCart = await tx.cart.findUnique({ where: { userId: req.user.id } });
        if (userCart) await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
      }

      return newOrder;
    });

    return successResponse(res, order, 'Đặt hàng thành công', 201);
  } catch (err) {
    if (err.message?.includes('không tồn tại') || err.message?.includes('hàng')) {
      return errorResponse(res, err.message, 400);
    }
    next(err);
  }
};

// ─── GET /api/orders/my-orders ────────────────────────────────────────────────

const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, orderStatus, paymentStatus } = req.query;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);

    const where = { userId: req.user.id };
    if (orderStatus  && ORDER_STATUS[orderStatus])   where.orderStatus  = orderStatus;
    if (paymentStatus && PAYMENT_STATUS[paymentStatus]) where.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          orderItems: { include: { product: { select: { id: true, name: true, thumbnail: true } } } },
          assignedShipper: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return paginatedResponse(res, orders, total, pageNum, limitNum);
  } catch (err) { next(err); }
};

// ─── GET /api/orders — Admin/Staff: toàn bộ đơn ─────────────────────────────

const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, orderStatus, paymentStatus, userId, search } = req.query;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);

    const where = {};
    if (req.user.role === 'SHIPPER') {
      where.orderStatus = 'READY_FOR_DELIVERY';
      where.assignedShipperId = null;
    }
    if (orderStatus  && ORDER_STATUS[orderStatus])      where.orderStatus  = orderStatus;
    if (paymentStatus && PAYMENT_STATUS[paymentStatus]) where.paymentStatus = paymentStatus;
    if (userId) where.userId = parseInt(userId);
    if (search) {
      where.OR = [
        { orderCode:     { contains: search } },
        { customerPhone: { contains: search } },
        { user: { fullName: { contains: search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:            { select: { id: true, fullName: true, email: true, phone: true } },
          assignedShipper: { select: { id: true, fullName: true, phone: true } },
          orderItems: {
            include: { product: { select: { id: true, name: true, thumbnail: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return paginatedResponse(res, orders, total, pageNum, limitNum);
  } catch (err) { next(err); }
};

// ─── GET /api/orders/:id ──────────────────────────────────────────────────────

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id: parseInt(id) };
    if (req.user.role === 'USER') where.userId = req.user.id;

    const order = await prisma.order.findFirst({
      where,
      include: {
        user:            { select: { id: true, fullName: true, email: true, phone: true } },
        assignedShipper: { select: { id: true, fullName: true, phone: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, thumbnail: true, price: true } } },
        },
        statusLogs: {
          include: { changedBy: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    return successResponse(res, order);
  } catch (err) { next(err); }
};

// ─── GET /api/orders/code/:orderCode ─────────────────────────────────────────

const getOrderByCode = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const where = { orderCode };
    if (req.user.role === 'USER') where.userId = req.user.id;

    const order = await prisma.order.findFirst({
      where,
      include: {
        user:            { select: { id: true, fullName: true, email: true, phone: true } },
        assignedShipper: { select: { id: true, fullName: true, phone: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, thumbnail: true, price: true } } },
        },
        statusLogs: {
          include: { changedBy: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    return successResponse(res, order);
  } catch (err) { next(err); }
};

// ─── GET /api/orders/:orderCode/payment-status ───────────────────────────────

const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: { paymentStatus: true, orderStatus: true },
    });
    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    return res.json({ orderCode, paymentStatus: order.paymentStatus, orderStatus: order.orderStatus });
  } catch (err) { next(err); }
};

// ─── PUT /api/orders/:id/status — State Machine ───────────────────────────────

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status, note } = req.body;
    const role       = req.user.role;

    if (!ORDER_STATUS[status]) {
      return errorResponse(res, `Trạng thái không hợp lệ: ${status}`, 400);
    }

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);

    // Kiểm tra state machine
    const allowedRoles = VALID_TRANSITIONS[order.orderStatus]?.[status];
    if (!allowedRoles) {
      return errorResponse(res, `Không thể chuyển từ ${order.orderStatus} sang ${status}`, 400);
    }
    if (!allowedRoles.includes(role)) {
      return errorResponse(res, `Vai trò ${role} không được phép thực hiện thao tác này`, 403);
    }

    // Guard: READY_FOR_DELIVERY → DELIVERING yêu cầu có shipper
    if (status === ORDER_STATUS.DELIVERING && !order.assignedShipperId) {
      return errorResponse(res, 'Đơn hàng chưa được phân công shipper. Vui lòng phân công trước khi giao.', 400);
    }

    // Guard: Shipper chỉ được cập nhật đơn hàng của chính mình
    if (role === 'SHIPPER' && order.assignedShipperId !== req.user.id) {
      return errorResponse(res, 'Bạn không được phép cập nhật đơn hàng của shipper khác.', 403);
    }

    const updateData = buildStatusTransitionData(order.orderStatus, status);

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: order.id },
        data:  updateData,
        include: {
          user:            { select: { id: true, fullName: true, email: true } },
          assignedShipper: { select: { id: true, fullName: true, phone: true } },
          orderItems:      { include: { product: true } },
        },
      });

      await logStatusChange(tx, {
        orderId:     order.id,
        fromStatus:  order.orderStatus,
        toStatus:    status,
        changedById: req.user.id,
        note,
      });

      return result;
    });

    // Realtime notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.userId}`).emit('order_status_updated', {
        orderId:     order.id,
        orderCode:   order.orderCode,
        orderStatus: status,
      });
      io.to('staff_dashboard').emit('order_status_updated', {
        orderId:     order.id,
        orderCode:   order.orderCode,
        orderStatus: status,
      });
    }

    return successResponse(res, updated, 'Cập nhật trạng thái đơn hàng thành công');
  } catch (err) { next(err); }
};

// ─── PUT /api/orders/:id/payment-status — Admin/Staff ────────────────────────

const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;

    if (!PAYMENT_STATUS[status]) {
      return errorResponse(res, `Trạng thái thanh toán không hợp lệ: ${status}`, 400);
    }

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        paymentStatus: status,
        paidAt: status === 'PAID' ? new Date() : undefined,
      },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    return successResponse(res, updated, 'Cập nhật trạng thái thanh toán thành công');
  } catch (err) { next(err); }
};

// ─── PUT /api/orders/:id/cancel — Hủy đơn ───────────────────────────────────

const cancelOrder = async (req, res, next) => {
  try {
    const { id }     = req.params;
    const { reason } = req.body;
    const role       = req.user.role;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { orderItems: true },
    });
    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);

    // Kiểm tra trạng thái có thể hủy
    const allowedRoles = VALID_TRANSITIONS[order.orderStatus]?.CANCELLED;
    if (!allowedRoles) {
      return errorResponse(res, `Không thể hủy đơn ở trạng thái ${order.orderStatus}`, 400);
    }
    if (!allowedRoles.includes(role)) {
      return errorResponse(res, `Vai trò ${role} không được phép hủy đơn ở trạng thái này`, 403);
    }

    // Chỉ REFUNDED nếu đã PAID — giữ nguyên nếu COD hoặc chưa thanh toán
    const newPaymentStatus = order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus;

    const updated = await prisma.$transaction(async (tx) => {
      // Hoàn lại tồn kho
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data:  { stock: { increment: item.quantity } },
        });
      }

      const result = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus:   ORDER_STATUS.CANCELLED,
          paymentStatus: newPaymentStatus,
          cancelledAt:   new Date(),
          cancelReason:  reason || null,
        },
        include: {
          user:       { select: { id: true, fullName: true, email: true } },
          orderItems: { include: { product: true } },
        },
      });

      await logStatusChange(tx, {
        orderId:     order.id,
        fromStatus:  order.orderStatus,
        toStatus:    ORDER_STATUS.CANCELLED,
        changedById: req.user.id,
        note:        reason || 'Hủy đơn',
      });

      return result;
    });

    // Realtime
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${order.userId}`).emit('order_status_updated', {
        orderId:     order.id,
        orderCode:   order.orderCode,
        orderStatus: ORDER_STATUS.CANCELLED,
      });
    }

    return successResponse(res, updated, `Đơn hàng đã hủy${newPaymentStatus === 'REFUNDED' ? ' — Trạng thái hoàn tiền đã được ghi nhận' : ''}`);
  } catch (err) { next(err); }
};

// ─── PUT /api/orders/:id/assign-shipper — Admin phân công ────────────────────

const assignShipper = async (req, res, next) => {
  try {
    const { id }        = req.params;
    const { shipperId } = req.body;

    if (!shipperId) return errorResponse(res, 'shipperId là bắt buộc', 400);

    // Validate shipper phải có role = SHIPPER
    const shipper = await prisma.user.findUnique({ where: { id: parseInt(shipperId) } });
    if (!shipper) return errorResponse(res, 'Không tìm thấy tài khoản shipper', 404);
    if (shipper.role !== 'SHIPPER') {
      return errorResponse(res, 'Chỉ có thể phân công tài khoản có vai trò Shipper', 400);
    }

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    if (![ORDER_STATUS.READY_FOR_DELIVERY, ORDER_STATUS.DELIVERING].includes(order.orderStatus)) {
      return errorResponse(res, 'Chỉ có thể phân công shipper cho đơn đang ở trạng thái Ready For Delivery', 400);
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data:  { assignedShipperId: parseInt(shipperId) },
      include: {
        user:            { select: { id: true, fullName: true } },
        assignedShipper: { select: { id: true, fullName: true, phone: true } },
      },
    });

    // Notify shipper
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${shipperId}`).emit('order_assigned', {
        orderId: order.id, orderCode: order.orderCode,
      });
    }

    return successResponse(res, updated, `Đã phân công shipper ${shipper.fullName}`);
  } catch (err) { next(err); }
};

// ─── PUT /api/orders/:id/self-assign — Shipper tự nhận (race-condition safe) ─

const selfAssignShipper = async (req, res, next) => {
  try {
    const { id }   = req.params;
    const shipperId = req.user.id;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
    if (order.orderStatus !== ORDER_STATUS.READY_FOR_DELIVERY) {
      return errorResponse(res, 'Đơn hàng chưa sẵn sàng để nhận', 400);
    }

    // updateMany với điều kiện assignedShipperId IS NULL — atomic, chống race condition
    const result = await prisma.order.updateMany({
      where: { id: parseInt(id), assignedShipperId: null },
      data:  { assignedShipperId: shipperId },
    });

    if (result.count === 0) {
      return errorResponse(res, 'Đơn hàng này đã được nhận bởi shipper khác', 409);
    }

    const updated = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        user:            { select: { id: true, fullName: true, phone: true } },
        assignedShipper: { select: { id: true, fullName: true, phone: true } },
        orderItems:      { include: { product: { select: { id: true, name: true, thumbnail: true } } } },
      },
    });

    return successResponse(res, updated, 'Đã nhận đơn hàng thành công');
  } catch (err) { next(err); }
};

// ─── GET /api/orders/shipper/my-orders — Shipper xem đơn được gán ────────────

const getShipperOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, orderStatus } = req.query;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);

    const where = { assignedShipperId: req.user.id };
    if (orderStatus) {
      if (orderStatus.includes(',')) {
        const statuses = orderStatus.split(',').filter(s => ORDER_STATUS[s]);
        where.orderStatus = { in: statuses };
      } else if (ORDER_STATUS[orderStatus]) {
        where.orderStatus = orderStatus;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user:       { select: { id: true, fullName: true, phone: true } },
          orderItems: { include: { product: { select: { id: true, name: true, thumbnail: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    return paginatedResponse(res, orders, total, pageNum, limitNum);
  } catch (err) { next(err); }
};

// ─── GET /api/orders/stats — Admin tổng quan ─────────────────────────────────

const getOrderStats = async (req, res, next) => {
  try {
    const [
      total, pendingConfirmation, confirmed, preparing,
      readyForDelivery, delivering, delivered, cancelled,
      totalRevenue, todayOrders,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'PENDING_CONFIRMATION' } }),
      prisma.order.count({ where: { orderStatus: 'CONFIRMED' } }),
      prisma.order.count({ where: { orderStatus: 'PREPARING' } }),
      prisma.order.count({ where: { orderStatus: 'READY_FOR_DELIVERY' } }),
      prisma.order.count({ where: { orderStatus: 'DELIVERING' } }),
      prisma.order.count({ where: { orderStatus: 'DELIVERED' } }),
      prisma.order.count({ where: { orderStatus: 'CANCELLED' } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return successResponse(res, {
      total, pendingConfirmation, confirmed, preparing,
      readyForDelivery, delivering, delivered, cancelled,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      todayOrders,
    });
  } catch (err) { next(err); }
};

// ─── GET /api/orders/shippers — Admin: danh sách shipper ─────────────────────

const getShippers = async (req, res, next) => {
  try {
    const shippers = await prisma.user.findMany({
      where: { role: 'SHIPPER', isActive: true },
      select: {
        id: true, fullName: true, phone: true, email: true, isOnline: true,
        _count: { select: { assignedOrders: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    return successResponse(res, shippers);
  } catch (err) { next(err); }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  getOrderByCode,
  getPaymentStatus,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  assignShipper,
  selfAssignShipper,
  getShipperOrders,
  getOrderStats,
  getShippers,
};
