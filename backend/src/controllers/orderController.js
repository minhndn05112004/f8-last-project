const { z } = require('zod');
const prisma = require('../config/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const VALID_ORDER_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
const VALID_PAYMENT_STATUSES = ['PENDING', 'PAID', 'FAILED'];

const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, 'Shipping address is required'),
  customerPhone: z.string().min(9, 'Phone number is required'),
  customerEmail: z.string().email('Valid email is required'),
  note: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']).default('CASH'),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  })).optional(), // optional — can use cart items
});

// POST /api/orders — place order from cart or explicit items
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, customerPhone, customerEmail, note, paymentMethod, items: directItems } = createOrderSchema.parse(req.body);

    let orderItems;

    if (directItems && directItems.length > 0) {
      // Direct order with specific items
      orderItems = await Promise.all(
        directItems.map(async ({ productId, quantity }) => {
          const product = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
          if (!product) throw new Error(`Product ${productId} not found`);
          if (product.stock < quantity) throw new Error(`Insufficient stock for ${product.name}`);
          return { product, quantity };
        })
      );
    } else {
      // Order from cart
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: { include: { product: true } } },
      });

      if (!cart || !cart.items || cart.items.length === 0) return errorResponse(res, 'Giỏ hàng trống', 400);

      const invalidItems = cart.items.filter((i) => i.product.isDeleted || i.product.stock < i.quantity);
      if (invalidItems.length > 0) {
        return errorResponse(res, 'Một số sản phẩm đã hết hàng hoặc không còn bán', 400);
      }

      orderItems = cart.items.map(({ product, quantity }) => ({ product, quantity }));
    }

    const totalAmount = orderItems.reduce((sum, { product, quantity }) => {
      return sum + (product.salePrice || product.price) * quantity;
    }, 0);

    // Generate unique order code
    const orderCode = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Create order + items in transaction
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
          paymentStatus: 'PENDING',
          orderStatus: paymentMethod === 'BANK_TRANSFER' ? 'PENDING' : 'PROCESSING',
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

      // Update user profile info (autofill for future checkouts)
      await tx.user.update({
        where: { id: req.user.id },
        data: {
          address: shippingAddress,
          phone: customerPhone,
          // email shouldn't be updated if it's the login identifier, but we'll assume it is fine here or just update address/phone
        }
      });

      // Decrement stock
      for (const { product, quantity } of orderItems) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: quantity } },
        });
      }

      // Clear cart if ordered from cart
      if (!directItems) {
        const userCart = await tx.cart.findUnique({ where: { userId: req.user.id } });
        if (userCart) {
          await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }
      }

      return newOrder;
    });

    return successResponse(res, order, 'Order placed successfully', 201);
  } catch (err) {
    if (err.message?.includes('not found') || err.message?.includes('stock')) {
      return errorResponse(res, err.message, 400);
    }
    next(err);
  }
};

// GET /api/orders/my-orders — current user's orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, orderStatus, paymentStatus } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = { userId: req.user.id };
    if (orderStatus && VALID_ORDER_STATUSES.includes(orderStatus)) where.orderStatus = orderStatus;
    if (paymentStatus && VALID_PAYMENT_STATUSES.includes(paymentStatus)) where.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
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
  } catch (err) {
    next(err);
  }
};

// GET /api/orders — admin/staff view all orders
const getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, orderStatus, paymentStatus, userId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = {};
    if (orderStatus && VALID_ORDER_STATUSES.includes(orderStatus)) where.orderStatus = orderStatus;
    if (paymentStatus && VALID_PAYMENT_STATUSES.includes(paymentStatus)) where.paymentStatus = paymentStatus;
    if (userId) where.userId = parseInt(userId);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
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
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/:id/status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // should map to orderStatus

    if (!VALID_ORDER_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid order status. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`, 400);
    }

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return errorResponse(res, 'Order not found', 404);

    // Prevent updating completed/cancelled orders
    if (['DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
      return errorResponse(res, `Cannot update a ${order.orderStatus} order`, 400);
    }

    // If cancelling, restore stock
    if (status === 'CANCELLED') {
      const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
      await prisma.$transaction(
        orderItems.map((item) =>
          prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );
    }

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { orderStatus: status },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        orderItems: { include: { product: true } },
      },
    });

    return successResponse(res, updated, 'Order status updated');
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/:id/payment-status
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 

    if (!VALID_PAYMENT_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`, 400);
    }

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return errorResponse(res, 'Order not found', 404);

    const updated = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { 
        paymentStatus: status,
        paidAt: status === 'PAID' ? new Date() : null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    return successResponse(res, updated, 'Payment status updated');
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id — get single order
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const where = { id: parseInt(id) };

    // Users can only see their own orders
    if (req.user.role === 'USER') where.userId = req.user.id;

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, thumbnail: true, price: true } } },
        },
      },
    });

    if (!order) return errorResponse(res, 'Order not found', 404);
    return successResponse(res, order);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:orderCode/payment-status
const getPaymentStatus = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    
    const order = await prisma.order.findUnique({
      where: { orderCode },
      select: { paymentStatus: true, orderStatus: true }
    });

    if (!order) return errorResponse(res, 'Order not found', 404);
    return res.json({
      orderCode,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/code/:orderCode — lookup by orderCode string
const getOrderByCode = async (req, res, next) => {
  try {
    const { orderCode } = req.params;
    const where = { orderCode };

    // Users can only see their own orders
    if (req.user.role === 'USER') where.userId = req.user.id;

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        orderItems: {
          include: { product: { select: { id: true, name: true, thumbnail: true, price: true } } },
        },
      },
    });

    if (!order) return errorResponse(res, 'Order not found', 404);
    return successResponse(res, order);
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus, updatePaymentStatus, getOrderById, getPaymentStatus, getOrderByCode };
