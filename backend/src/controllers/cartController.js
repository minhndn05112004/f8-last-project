const { z } = require('zod');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const addToCartSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().default(1),
});

const getCart = async (req, res, next) => {
  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          select: {
            id: true, name: true, price: true, salePrice: true,
            thumbnail: true, stock: true, isDeleted: true,
          },
        },
      },
    });

    // Filter out deleted products
    const validItems = cartItems.filter((item) => !item.product.isDeleted);

    const total = validItems.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    return successResponse(res, { items: validItems, total });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = addToCartSchema.parse(req.body);

    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false },
    });
    if (!product) return errorResponse(res, 'Product not found', 404);
    if (product.stock < quantity) return errorResponse(res, 'Insufficient stock', 400);

    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId: req.user.id, productId, quantity },
      include: { product: { select: { id: true, name: true, price: true, salePrice: true, thumbnail: true } } },
    });

    return successResponse(res, cartItem, 'Added to cart', 201);
  } catch (err) {
    next(err);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = z.object({ quantity: z.coerce.number().int().positive() }).parse(req.body);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
      include: { product: true },
    });
    if (!cartItem) return errorResponse(res, 'Cart item not found', 404);
    if (cartItem.product.stock < quantity) return errorResponse(res, 'Insufficient stock', 400);

    const updated = await prisma.cartItem.update({
      where: { id: parseInt(id) },
      data: { quantity },
    });

    return successResponse(res, updated, 'Cart item updated');
  } catch (err) {
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cartItem = await prisma.cartItem.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
    });
    if (!cartItem) return errorResponse(res, 'Cart item not found', 404);

    await prisma.cartItem.delete({ where: { id: parseInt(id) } });
    return successResponse(res, null, 'Item removed from cart');
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    return successResponse(res, null, 'Cart cleared');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
