import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roles.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  areaCreateSchema,
  backofficeUsersQuerySchema,
  examDateCreateSchema,
  examDateUpdateSchema,
  phraseCreateSchema,
  phraseUpdateSchema,
  planCreateSchema,
  planUpdateSchema,
  specialtyCreateSchema,
  specialtyUpdateSchema,
  userRoleUpdateSchema,
} from '../schemas/backoffice.schema.js';
import { prisma } from '../config/database.js';
import { effectivePlanFromProfile } from '../services/profile.service.js';
import { paginationParams, totalPages } from '../utils/helpers.js';
import { cacheService } from '../services/cache.service.js';
import { invalidateSpecialtyCache } from '../services/specialty.service.js';
import { paramString } from '../utils/params.js';

export const backofficeRouter = Router();

backofficeRouter.use(authenticate, requireAdmin());

/* --- Specialties --- */
backofficeRouter.get('/specialties', async (_req, res, next) => {
  try {
    const rows = await prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      include: { areas: { orderBy: { name: 'asc' } } },
    });
    res.json({ data: rows });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post('/specialties', validateBody(specialtyCreateSchema), async (req, res, next) => {
  try {
    const s = await prisma.specialty.create({ data: { name: req.body.name } });
    await invalidateSpecialtyCache();
    res.status(201).json({ data: s });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.put(
  '/specialties/:id',
  validateBody(specialtyUpdateSchema),
  async (req, res, next) => {
    try {
      const s = await prisma.specialty.update({
        where: { id: paramString(req.params.id) },
        data: { name: req.body.name },
      });
      await invalidateSpecialtyCache();
      res.json({ data: s });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete('/specialties/:id', async (req, res, next) => {
  try {
    await prisma.specialty.delete({ where: { id: paramString(req.params.id) } });
    await invalidateSpecialtyCache();
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post(
  '/specialties/:specialtyId/areas',
  validateBody(areaCreateSchema),
  async (req, res, next) => {
    try {
      const a = await prisma.area.create({
        data: { specialtyId: paramString(req.params.specialtyId), name: req.body.name },
      });
      await invalidateSpecialtyCache();
      res.status(201).json({ data: a });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.put(
  '/areas/:areaId',
  validateBody(areaCreateSchema),
  async (req, res, next) => {
    try {
      const a = await prisma.area.update({
        where: { id: paramString(req.params.areaId) },
        data: { name: req.body.name },
      });
      await invalidateSpecialtyCache();
      res.json({ data: a });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete('/areas/:areaId', async (req, res, next) => {
  try {
    await prisma.area.delete({ where: { id: paramString(req.params.areaId) } });
    await invalidateSpecialtyCache();
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Phrases --- */
backofficeRouter.get('/phrases', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginationParams(
      req.query.page as string,
      req.query.limit as string
    );
    const [total, data] = await Promise.all([
      prisma.motivationalPhrase.count(),
      prisma.motivationalPhrase.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    res.json({ data, total, page, totalPages: totalPages(total, limit) });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post('/phrases', validateBody(phraseCreateSchema), async (req, res, next) => {
  try {
    const row = await prisma.motivationalPhrase.create({ data: req.body });
    await cacheService.invalidate('cache:phrases*');
    res.status(201).json({ data: row });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.put(
  '/phrases/:id',
  validateBody(phraseUpdateSchema),
  async (req, res, next) => {
    try {
      const row = await prisma.motivationalPhrase.update({
        where: { id: paramString(req.params.id) },
        data: req.body,
      });
      await cacheService.invalidate('cache:phrases*');
      res.json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete('/phrases/:id', async (req, res, next) => {
  try {
    await prisma.motivationalPhrase.delete({ where: { id: paramString(req.params.id) } });
    await cacheService.invalidate('cache:phrases*');
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Exam dates --- */
backofficeRouter.get('/exam-dates', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginationParams(
      req.query.page as string,
      req.query.limit as string
    );
    const [total, data] = await Promise.all([
      prisma.examDate.count(),
      prisma.examDate.findMany({
        skip,
        take,
        orderBy: { date: 'asc' },
      }),
    ]);
    res.json({
      data: data.map((d) => ({
        ...d,
        date: d.date.toISOString(),
      })),
      total,
      page,
      totalPages: totalPages(total, limit),
    });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post('/exam-dates', validateBody(examDateCreateSchema), async (req, res, next) => {
  try {
    const row = await prisma.examDate.create({
      data: {
        name: req.body.name,
        date: new Date(req.body.date),
        isActive: req.body.isActive ?? true,
      },
    });
    await cacheService.invalidate('cache:exam-dates*');
    res.status(201).json({ data: { ...row, date: row.date.toISOString() } });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.put(
  '/exam-dates/:id',
  validateBody(examDateUpdateSchema),
  async (req, res, next) => {
    try {
      const b = req.body as {
        name?: string;
        date?: string;
        isActive?: boolean;
      };
      const row = await prisma.examDate.update({
        where: { id: paramString(req.params.id) },
        data: {
          ...(b.name != null ? { name: b.name } : {}),
          ...(b.date != null ? { date: new Date(b.date) } : {}),
          ...(b.isActive != null ? { isActive: b.isActive } : {}),
        },
      });
      await cacheService.invalidate('cache:exam-dates*');
      res.json({ data: { ...row, date: row.date.toISOString() } });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete('/exam-dates/:id', async (req, res, next) => {
  try {
    await prisma.examDate.delete({ where: { id: paramString(req.params.id) } });
    await cacheService.invalidate('cache:exam-dates*');
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Pricing --- */
backofficeRouter.get('/pricing', async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginationParams(
      req.query.page as string,
      req.query.limit as string
    );
    const [total, data] = await Promise.all([
      prisma.subscriptionPlan.count(),
      prisma.subscriptionPlan.findMany({ skip, take, orderBy: { price: 'asc' } }),
    ]);
    res.json({ data, total, page, totalPages: totalPages(total, limit) });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post('/pricing', validateBody(planCreateSchema), async (req, res, next) => {
  try {
    const row = await prisma.subscriptionPlan.create({ data: req.body });
    res.status(201).json({ data: row });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.put(
  '/pricing/:id',
  validateBody(planUpdateSchema),
  async (req, res, next) => {
    try {
      const row = await prisma.subscriptionPlan.update({
        where: { id: paramString(req.params.id) },
        data: req.body,
      });
      res.json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete('/pricing/:id', async (req, res, next) => {
  try {
    await prisma.subscriptionPlan.delete({ where: { id: paramString(req.params.id) } });
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Users --- */
backofficeRouter.get(
  '/users',
  validateQuery(backofficeUsersQuerySchema),
  async (req, res, next) => {
    try {
      const q = req.query as {
        search?: string;
        role?: 'admin' | 'editor' | 'user';
        page?: string;
        limit?: string;
      };
      const { skip, take, page, limit } = paginationParams(q.page, q.limit);
      const where = {
        ...(q.search
          ? {
              OR: [
                { email: { contains: q.search } },
                { firstName: { contains: q.search } },
                { lastName: { contains: q.search } },
              ],
            }
          : {}),
        ...(q.role
          ? {
              roles: { some: { role: q.role } },
            }
          : {}),
      };
      const [total, profiles] = await Promise.all([
        prisma.profile.count({ where }),
        prisma.profile.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
            subscriptionTier: true,
            subscriptionExpiresAt: true,
            roles: true,
          },
        }),
      ]);
      const data = profiles.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`.trim(),
        email: p.email,
        roles: p.roles.map((r) => r.role),
        plan: effectivePlanFromProfile(p).plan,
        status: 'active' as const,
        registeredAt: p.createdAt.toISOString(),
        lastAccess: p.updatedAt.toISOString(),
        examsCompleted: 0,
      }));
      res.json({ data, total, page, totalPages: totalPages(total, limit) });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.put(
  '/users/:id/role',
  validateBody(userRoleUpdateSchema),
  async (req, res, next) => {
    try {
      const userId = paramString(req.params.id);
      const { roles } = req.body as { roles: ('admin' | 'editor' | 'user')[] };
      await prisma.$transaction([
        prisma.userRole.deleteMany({ where: { userId } }),
        prisma.userRole.createMany({
          data: roles.map((role) => ({ userId, role })),
        }),
      ]);
      const p = await prisma.profile.findUnique({
        where: { id: userId },
        include: { roles: true },
      });
      res.json({
        data: {
          id: p?.id,
          roles: p?.roles?.map((r) => r.role) ?? [],
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.get('/stats', async (_req, res, next) => {
  try {
    const [totalUsers, totalExams, totalCases, totalQuestions] = await Promise.all([
      prisma.profile.count(),
      prisma.exam.count(),
      prisma.clinicalCase.count(),
      prisma.question.count(),
    ]);
    res.json({
      data: {
        totalUsers,
        totalExams,
        totalCases,
        totalQuestions,
        activeUsers: totalUsers,
        freeUsers: totalUsers,
        monthlySubscribers: 0,
        semesterSubscribers: 0,
        annualSubscribers: 0,
        estimatedRevenue: 0,
        avgAccuracy: 0,
        abandonRate: 0,
      },
    });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.get('/subscription-cancellation-feedback', async (_req, res, next) => {
  try {
    const rows = await prisma.subscriptionCancellationFeedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    res.json({
      data: {
        items: rows.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          provider: r.provider,
          reason: r.reason,
          details: r.details,
          userEmail: r.user.email,
          userName: `${r.user.firstName} ${r.user.lastName}`.trim(),
        })),
      },
    });
  } catch (e) {
    next(e);
  }
});
