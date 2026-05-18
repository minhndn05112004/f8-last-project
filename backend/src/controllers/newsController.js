const { z } = require('zod');
const slugify = require('slugify');
const prisma = require('../config/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

const newsSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content is required'),
});

const getNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = {};
    if (search) where.title = { contains: search };

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: { createdBy: { select: { id: true, fullName: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.news.count({ where }),
    ]);

    return paginatedResponse(res, news, total, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
};

const getNewsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const article = await prisma.news.findUnique({
      where: { slug },
      include: { createdBy: { select: { id: true, fullName: true, avatar: true } } },
    });

    if (!article) return errorResponse(res, 'Article not found', 404);
    return successResponse(res, article);
  } catch (err) {
    next(err);
  }
};

const createNews = async (req, res, next) => {
  try {
    const { title, content } = newsSchema.parse(req.body);
    let slug = slugify(title, { lower: true, strict: true });

    const existing = await prisma.news.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    let thumbnail = null;
    if (req.file) thumbnail = `/${req.file.path.replace(/\\/g, '/')}`;

    const article = await prisma.news.create({
      data: { title, slug, content, thumbnail, createdById: req.user.id },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });

    return successResponse(res, article, 'Article created', 201);
  } catch (err) {
    next(err);
  }
};

const updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = newsSchema.partial().parse(req.body);

    const existing = await prisma.news.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return errorResponse(res, 'Article not found', 404);

    const updateData = {};
    if (title) {
      updateData.title = title;
      let slug = slugify(title, { lower: true, strict: true });
      const slugExists = await prisma.news.findFirst({ where: { slug, NOT: { id: parseInt(id) } } });
      if (slugExists) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }
    if (content) updateData.content = content;
    if (req.file) updateData.thumbnail = `/${req.file.path.replace(/\\/g, '/')}`;

    const article = await prisma.news.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { createdBy: { select: { id: true, fullName: true } } },
    });

    return successResponse(res, article, 'Article updated');
  } catch (err) {
    next(err);
  }
};

const deleteNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.news.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return errorResponse(res, 'Article not found', 404);

    await prisma.news.delete({ where: { id: parseInt(id) } });
    return successResponse(res, null, 'Article deleted');
  } catch (err) {
    next(err);
  }
};

module.exports = { getNews, getNewsBySlug, createNews, updateNews, deleteNews };
