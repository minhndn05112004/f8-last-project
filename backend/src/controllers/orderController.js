const { z } = require('zod');
const prisma = require('../config/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];

const createOrderSchema = z.object({
  shippingAddress: z.string().min(5, 'Shipping address is required'),
  paymentMethod: z.enum(['COD', 'BANK_TRANSFER']).default('COD'),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive(),
    quantity: z.coerce.number().int().positive(),
  })).optional(), // optional — can use cart items
});

// POST /api/orders — place order from cart or explicit items
const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, paymentMethod, items: directItems } = createOrderSchema.parse(req.body);

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
      const cartItems = await prisma.cartItem.findMany({
        where: { userId: req.user.id },
        include: { product: true },
      });

      if (!cartItems.length) return errorResponse(res, 'Cart is empty', 400);

      const invalidItems = cartItems.filter((i) => i.product.isDeleted || i.product.stock < i.quantity);
      if (invalidItems.length > 0) {
        return errorResponse(res, 'Some items are out of stock or unavailable', 400);
      }

      orderItems = cartItems.map(({ product, quantity }) => ({ product, quantity }));
    }

    const totalPrice = orderItems.reduce((sum, { product, quantity }) => {
      return sum + (product.salePrice || product.price) * quantity;
    }, 0);

    // Create order + items in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          totalPrice,
          shippingAddress,
          paymentMethod,
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

      // Decrement stock
      for (const { product, quantity } of orderItems) {
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: quantity } },
        });
      }

      // Clear cart if ordered from cart
      if (!directItems) {
        await tx.cartItem.deleteMany({ where: { userId: req.user.id } });
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
    const { page = 1, limit = 10, status } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = { userId: req.user.id };
    if (status && VALID_STATUSES.includes(status)) where.status = status;

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
    const { page = 1, limit = 20, status, userId } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = {};
    if (status && VALID_STATUSES.includes(status)) where.status = status;
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
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    if (!order) return errorResponse(res, 'Order not found', 404);

    // Prevent updating completed/cancelled orders
    if (['COMPLETED', 'CANCELLED'].includes(order.status)) {
      return errorResponse(res, `Cannot update a ${order.status} order`, 400);
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
      data: { status },
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

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus, getOrderById };
