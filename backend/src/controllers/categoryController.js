const { z } = require('zod');
const slugify = require('slugify');
const prisma = require('../config/prisma');
const { successResponse, errorResponse } = require('../utils/response');

const categorySchema = z.object({
  name: z.string().min(2, 'Category name is required'),
});

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { products: { where: { isDeleted: false } } } },
      },
    });
    return successResponse(res, categories);
  } catch (err) {
    next(err);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name } = categorySchema.parse(req.body);
    let slug = slugify(name, { lower: true, strict: true });

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const category = await prisma.category.create({ data: { name, slug } });
    return successResponse(res, category, 'Category created', 201);
  } catch (err) {
    next(err);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = categorySchema.parse(req.body);
    const catId = parseInt(id);

    const existing = await prisma.category.findUnique({ where: { id: catId } });
    if (!existing) return errorResponse(res, 'Category not found', 404);

    let slug = slugify(name, { lower: true, strict: true });
    if (slug !== existing.slug) {
      const slugExists = await prisma.category.findFirst({ where: { slug, NOT: { id: catId } } });
      if (slugExists) slug = `${slug}-${Date.now()}`;
    }

    const category = await prisma.category.update({ where: { id: catId }, data: { name, slug } });
    return successResponse(res, category, 'Category updated');
  } catch (err) {
    next(err);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const catId = parseInt(id);

    const productCount = await prisma.product.count({ where: { categoryId: catId, isDeleted: false } });
    if (productCount > 0) {
      return errorResponse(res, 'Cannot delete category with existing products', 400);
    }

    await prisma.category.delete({ where: { id: catId } });
    return successResponse(res, null, 'Category deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
