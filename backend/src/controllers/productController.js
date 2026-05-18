const { z } = require('zod');
const slugify = require('slugify');
const prisma = require('../config/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// ─── Validation ──────────────────────────────────────────────────────────────

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  salePrice: z.coerce.number().positive().optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  categoryId: z.coerce.number().int().positive('Category is required'),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const generateSlug = async (name, excludeId = null) => {
  let slug = slugify(name, { lower: true, strict: true });
  const existing = await prisma.product.findFirst({
    where: { slug, NOT: excludeId ? { id: excludeId } : undefined },
  });
  if (existing) slug = `${slug}-${Date.now()}`;
  return slug;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      categoryId,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = { isDeleted: false };

    if (categoryId) where.categoryId = parseInt(categoryId);
    if (search) where.name = { contains: search };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const allowedSortFields = ['createdAt', 'price', 'name', 'stock'];
    const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        orderBy: { [orderByField]: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    // Parse images JSON
    const formatted = products.map((p) => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return paginatedResponse(res, formatted, total, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findFirst({
      where: { id: parseInt(id), isDeleted: false },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });

    if (!product) return errorResponse(res, 'Product not found', 404);

    return successResponse(res, { ...product, images: JSON.parse(product.images || '[]') });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const slug = await generateSlug(data.name);

    let thumbnail = null;
    let images = [];

    if (req.files) {
      if (req.files['thumbnail']?.[0]) {
        thumbnail = `/${req.files['thumbnail'][0].path.replace(/\\/g, '/')}`;
      }
      if (req.files['images']) {
        images = req.files['images'].map((f) => `/${f.path.replace(/\\/g, '/')}`);
      }
    }

    const product = await prisma.product.create({
      data: {
        ...data,
        slug,
        thumbnail,
        images: JSON.stringify(images),
        createdById: req.user.id,
      },
      include: { category: true },
    });

    return successResponse(
      res,
      { ...product, images: JSON.parse(product.images) },
      'Product created successfully',
      201
    );
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    const existing = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
    if (!existing) return errorResponse(res, 'Product not found', 404);

    const data = productSchema.partial().parse(req.body);
    const updateData = { ...data };

    if (data.name && data.name !== existing.name) {
      updateData.slug = await generateSlug(data.name, productId);
    }

    if (req.files) {
      if (req.files['thumbnail']?.[0]) {
        updateData.thumbnail = `/${req.files['thumbnail'][0].path.replace(/\\/g, '/')}`;
      }
      if (req.files['images']) {
        updateData.images = JSON.stringify(
          req.files['images'].map((f) => `/${f.path.replace(/\\/g, '/')}`)
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: { category: true },
    });

    return successResponse(res, { ...product, images: JSON.parse(product.images) }, 'Product updated');
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id);

    const existing = await prisma.product.findFirst({ where: { id: productId, isDeleted: false } });
    if (!existing) return errorResponse(res, 'Product not found', 404);

    // Soft delete
    await prisma.product.update({ where: { id: productId }, data: { isDeleted: true } });

    return successResponse(res, null, 'Product deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
