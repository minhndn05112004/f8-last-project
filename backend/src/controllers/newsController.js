const { z } = require('zod');
const slugify = require('slugify');
const prisma = require('../config/prisma');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');

// ─── Validation Schemas ───────────────────────────────────────────────────────

const newsSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Content is required'),
  isPublished: z.union([z.boolean(), z.string()]).optional(),
});

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

const reactionSchema = z.object({
  type: z.enum(['LIKE', 'DISLIKE']),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

const parsePublished = (val) => {
  if (val === 'true' || val === true) return true;
  if (val === 'false' || val === false) return false;
  return false;
};

// ─── NEWS CRUD ────────────────────────────────────────────────────────────────

/**
 * GET /api/news
 * Public: list published articles (paginated, searchable)
 * Staff/Admin query param: ?all=true to see unpublished too
 */
const getNews = async (req, res, next) => {
  try {
    const { page = 1, limit = 9, search, all } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const where = {};
    // Only show published unless staff/admin requests all
    if (all !== 'true') {
      where.isPublished = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          createdBy: { select: { id: true, fullName: true, avatar: true } },
          _count: { select: { comments: true, reactions: true } },
          reactions: { select: { type: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.news.count({ where }),
    ]);

    // Compute likes/dislikes count
    const newsWithCounts = news.map((article) => {
      const likes = article.reactions.filter((r) => r.type === 'LIKE').length;
      const dislikes = article.reactions.filter((r) => r.type === 'DISLIKE').length;
      const { reactions, ...rest } = article;
      return { ...rest, likes, dislikes };
    });

    return paginatedResponse(res, newsWithCounts, total, pageNum, limitNum);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/news/latest
 * Public: Get latest 3 published articles for homepage
 */
const getLatestNews = async (req, res, next) => {
  try {
    const news = await prisma.news.findMany({
      where: { isPublished: true },
      include: {
        createdBy: { select: { id: true, fullName: true, avatar: true } },
        _count: { select: { comments: true, reactions: true } },
        reactions: { select: { type: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const newsWithCounts = news.map((article) => {
      const likes = article.reactions.filter((r) => r.type === 'LIKE').length;
      const dislikes = article.reactions.filter((r) => r.type === 'DISLIKE').length;
      const { reactions, ...rest } = article;
      return { ...rest, likes, dislikes };
    });

    return successResponse(res, newsWithCounts);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/news/:slug
 * Public: Get article by slug + increment views + include reaction summary
 */
const getNewsBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const article = await prisma.news.findUnique({
      where: { slug },
      include: {
        createdBy: { select: { id: true, fullName: true, avatar: true } },
        _count: { select: { comments: true } },
        reactions: { select: { type: true, userId: true } },
      },
    });

    if (!article) return errorResponse(res, 'Article not found', 404);
    if (!article.isPublished) return errorResponse(res, 'Article not available', 404);

    // Increment views
    await prisma.news.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    const likes = article.reactions.filter((r) => r.type === 'LIKE').length;
    const dislikes = article.reactions.filter((r) => r.type === 'DISLIKE').length;
    const { reactions, ...rest } = article;

    return successResponse(res, { ...rest, views: article.views + 1, likes, dislikes });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/news — Staff/Admin only
 */
const createNews = async (req, res, next) => {
  try {
    const parsed = newsSchema.parse(req.body);
    const { title, excerpt, content } = parsed;
    const isPublished = parsePublished(parsed.isPublished ?? req.body.isPublished);

    let slug = slugify(title, { lower: true, strict: true });
    const existing = await prisma.news.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    let thumbnail = null;
    if (req.file) {
      thumbnail = req.file.path.startsWith('http') ? req.file.path : `/uploads/news/${req.file.filename}`;
    }

    const article = await prisma.news.create({
      data: { title, slug, excerpt: excerpt || null, content, thumbnail, isPublished, createdById: req.user.id },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });

    return successResponse(res, article, 'Article created', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/news/:id — Staff/Admin only
 */
const updateNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = newsSchema.partial().parse(req.body);

    const existing = await prisma.news.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return errorResponse(res, 'Article not found', 404);

    const updateData = {};
    if (parsed.title) {
      updateData.title = parsed.title;
      let slug = slugify(parsed.title, { lower: true, strict: true });
      const slugExists = await prisma.news.findFirst({ where: { slug, NOT: { id: parseInt(id) } } });
      if (slugExists) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }
    if (parsed.content) updateData.content = parsed.content;
    if (parsed.excerpt !== undefined) updateData.excerpt = parsed.excerpt || null;
    if (parsed.isPublished !== undefined) updateData.isPublished = parsePublished(parsed.isPublished);
    // Handle isPublished from raw body (FormData string)
    if (req.body.isPublished !== undefined && parsed.isPublished === undefined) {
      updateData.isPublished = parsePublished(req.body.isPublished);
    }
    if (req.file) {
      updateData.thumbnail = req.file.path.startsWith('http') ? req.file.path : `/uploads/news/${req.file.filename}`;
    }

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

/**
 * DELETE /api/news/:id — Staff/Admin only
 */
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

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

/**
 * GET /api/news/:id/comments — Public
 */
const getComments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newsId = parseInt(id);

    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) return errorResponse(res, 'Article not found', 404);

    const comments = await prisma.newsComment.findMany({
      where: { newsId },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, comments);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/news/:id/comments — Auth required
 */
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newsId = parseInt(id);
    const { content } = commentSchema.parse(req.body);

    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news || !news.isPublished) return errorResponse(res, 'Article not found', 404);

    // Sanitize: strip basic HTML tags
    const sanitized = content.replace(/<[^>]*>/g, '').trim();

    const comment = await prisma.newsComment.create({
      data: { newsId, userId: req.user.id, content: sanitized },
      include: {
        user: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    return successResponse(res, comment, 'Comment added', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/comments/:id — Auth required (own comment or ADMIN/STAFF)
 */
const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const commentId = parseInt(id);

    const comment = await prisma.newsComment.findUnique({ where: { id: commentId } });
    if (!comment) return errorResponse(res, 'Comment not found', 404);

    const isOwner = comment.userId === req.user.id;
    const isModeratorRole = ['ADMIN', 'STAFF'].includes(req.user.role);

    if (!isOwner && !isModeratorRole) {
      return errorResponse(res, 'You do not have permission to delete this comment', 403);
    }

    await prisma.newsComment.delete({ where: { id: commentId } });
    return successResponse(res, null, 'Comment deleted');
  } catch (err) {
    next(err);
  }
};

// ─── REACTIONS ────────────────────────────────────────────────────────────────

/**
 * POST /api/news/:id/react — Auth required
 * Body: { type: "LIKE" | "DISLIKE" }
 * Logic:
 *   - If no reaction: create
 *   - If same type: remove (toggle off)
 *   - If different type: update
 */
const reactToNews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newsId = parseInt(id);
    const { type } = reactionSchema.parse(req.body);

    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news || !news.isPublished) return errorResponse(res, 'Article not found', 404);

    const existing = await prisma.newsReaction.findUnique({
      where: { newsId_userId: { newsId, userId: req.user.id } },
    });

    let action;
    if (!existing) {
      // Create new reaction
      await prisma.newsReaction.create({
        data: { newsId, userId: req.user.id, type },
      });
      action = 'added';
    } else if (existing.type === type) {
      // Same reaction — toggle off
      await prisma.newsReaction.delete({
        where: { newsId_userId: { newsId, userId: req.user.id } },
      });
      action = 'removed';
    } else {
      // Different reaction — update
      await prisma.newsReaction.update({
        where: { newsId_userId: { newsId, userId: req.user.id } },
        data: { type },
      });
      action = 'updated';
    }

    // Return fresh counts
    const [likes, dislikes, userReaction] = await Promise.all([
      prisma.newsReaction.count({ where: { newsId, type: 'LIKE' } }),
      prisma.newsReaction.count({ where: { newsId, type: 'DISLIKE' } }),
      prisma.newsReaction.findUnique({
        where: { newsId_userId: { newsId, userId: req.user.id } },
      }),
    ]);

    return successResponse(res, {
      likes,
      dislikes,
      userReaction: userReaction?.type || null,
      action,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/news/:id/my-reaction — Auth required
 * Returns current user's reaction on a news article
 */
const getMyReaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const newsId = parseInt(id);

    const reaction = await prisma.newsReaction.findUnique({
      where: { newsId_userId: { newsId, userId: req.user.id } },
    });

    return successResponse(res, { userReaction: reaction?.type || null });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNews,
  getLatestNews,
  getNewsBySlug,
  createNews,
  updateNews,
  deleteNews,
  getComments,
  addComment,
  deleteComment,
  reactToNews,
  getMyReaction,
};
