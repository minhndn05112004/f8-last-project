const { z } = require('zod');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const addToCartSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().default(1),
});

// Helper: find or create cart for user
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
};

const CART_INCLUDE = {
  items: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          salePrice: true,
          thumbnail: true,
          stock: true,
          isDeleted: true,
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
};

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: CART_INCLUDE,
    });

    if (!cart) {
      return successResponse(res, { items: [], total: 0, itemCount: 0 });
    }

    // Filter deleted products
    const validItems = cart.items.filter((item) => !item.product.isDeleted);

    const total = validItems.reduce((sum, item) => {
      const price = item.product.salePrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);

    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

    // Format product tags
    const formattedItems = validItems.map((item) => ({
      ...item,
      product: {
        ...item.product,
        tags: item.product.tags?.map((pt) => pt.tag) ?? [],
      },
    }));

    return successResponse(res, { items: formattedItems, total, itemCount });
  } catch (err) {
    next(err);
  }
};

// POST /api/cart/add
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = addToCartSchema.parse(req.body);

    const product = await prisma.product.findFirst({
      where: { id: productId, isDeleted: false, isPublished: true },
    });
    if (!product) return errorResponse(res, 'Product not found', 404);
    if (product.stock < quantity) return errorResponse(res, 'Không đủ hàng trong kho', 400);

    const cart = await getOrCreateCart(req.user.id);

    // Check existing item
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    let cartItem;
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.stock < newQty) return errorResponse(res, 'Không đủ hàng trong kho', 400);
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: { select: { id: true, name: true, price: true, salePrice: true, thumbnail: true } } },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
        include: { product: { select: { id: true, name: true, price: true, salePrice: true, thumbnail: true } } },
      });
    }

    // Update cart updatedAt
    await prisma.cart.update({ where: { id: cart.id }, data: {} });

    return successResponse(res, cartItem, 'Đã thêm vào giỏ hàng', 201);
  } catch (err) {
    next(err);
  }
};

// PUT /api/cart/item/:id
const updateCartItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity } = z.object({ quantity: z.coerce.number().int().positive() }).parse(req.body);

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return errorResponse(res, 'Cart not found', 404);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: parseInt(id), cartId: cart.id },
      include: { product: true },
    });
    if (!cartItem) return errorResponse(res, 'Cart item not found', 404);
    if (cartItem.product.stock < quantity) return errorResponse(res, 'Không đủ hàng trong kho', 400);

    const updated = await prisma.cartItem.update({
      where: { id: parseInt(id) },
      data: { quantity },
    });

    return successResponse(res, updated, 'Đã cập nhật giỏ hàng');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/item/:id
const removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return errorResponse(res, 'Cart not found', 404);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: parseInt(id), cartId: cart.id },
    });
    if (!cartItem) return errorResponse(res, 'Cart item not found', 404);

    await prisma.cartItem.delete({ where: { id: parseInt(id) } });
    return successResponse(res, null, 'Đã xóa sản phẩm khỏi giỏ hàng');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/cart/clear
const clearCart = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return successResponse(res, null, 'Cart is already empty');

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return successResponse(res, null, 'Đã xóa toàn bộ giỏ hàng');
  } catch (err) {
    next(err);
  }
};

// GET /api/cart/count
const getCartCount = async (req, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { select: { quantity: true } } },
    });
    const itemCount = cart?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;
    return successResponse(res, { itemCount });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, getCartCount };
