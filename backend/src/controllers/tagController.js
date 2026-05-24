const { z } = require('zod');
const slugify = require('slugify');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
});

// GET /api/tags - public
const getTags = async (req, res, next) => {
  try {
    const tags = await prisma.productTag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
    return successResponse(res, tags);
  } catch (err) {
    next(err);
  }
};

// POST /api/tags - STAFF/ADMIN only
const createTag = async (req, res, next) => {
  try {
    const { name } = tagSchema.parse(req.body);
    const slug = slugify(name, { lower: true, strict: true, locale: 'vi' });

    const existing = await prisma.productTag.findFirst({
      where: { OR: [{ name }, { slug }] },
    });
    if (existing) return errorResponse(res, 'Tag already exists', 409);

    const tag = await prisma.productTag.create({ data: { name, slug } });
    return successResponse(res, tag, 'Tag created', 201);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tags/:id - ADMIN only
const deleteTag = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.productTag.delete({ where: { id: parseInt(id) } });
    return successResponse(res, null, 'Tag deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getTags, createTag, deleteTag };
