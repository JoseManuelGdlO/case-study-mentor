import { timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import type { SubscriptionTier } from '@prisma/client';
import type { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireCaseEditor } from '../middleware/roles.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  areaCreateSchema,
  backofficeUserCreateSchema,
  backofficeUsersQuerySchema,
  examDateCreateSchema,
  examDateUpdateSchema,
  flashcardCreateSchema,
  flashcardUpdateSchema,
  phraseCreateSchema,
  phraseUpdateSchema,
  planCreateSchema,
  planUpdateSchema,
  promotionCodeCreateSchema,
  promotionCodePatchSchema,
  promotionCodePutSchema,
  specialtyCreateSchema,
  specialtyUpdateSchema,
  userRoleUpdateSchema,
  backofficeUserUpdateSchema,
  examReviewsQuerySchema,
  examReviewSubmitSchema,
  adminPushSubscribeSchema,
  adminPushUnsubscribeSchema,
  adminPushPreferencesSchema,
  backofficeImpersonateSchema,
} from '../schemas/backoffice.schema.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { PAID_TIERS, TIER_CHECKOUT, type PaidTier } from '../config/plans.js';
import {
  assertImpersonableTargetUser,
  createUserByAdmin,
  publicUser,
  setAuthCookies,
} from '../services/auth.service.js';
import { effectivePlanFromProfile } from '../services/profile.service.js';
import { getActiveSubscriptionPlanForTier } from '../services/subscription-plan.service.js';
import { paginationMeta, paginationParams, totalPages } from '../utils/helpers.js';
import { cacheService } from '../services/cache.service.js';
import { invalidateSpecialtyCache } from '../services/specialty.service.js';
import { paramString } from '../utils/params.js';
import {
  getMentorReviewExamDetail,
  listPendingMentorReviews,
  submitMentorReview,
} from '../services/exam-review.service.js';
import {
  getVapidPublicKey,
  isAdminPushConfigured,
  subscribeAdminPush,
  unsubscribeAdminPush,
  updateAdminPushPreferences,
  getAdminPushPreferences,
} from '../services/admin-push.service.js';
import { isSmtpConfigured } from '../services/email.service.js';
import {
  createPromotionCode,
  deletePromotionCode,
  listPromotionCodes,
  setPromotionCodeActive,
  updatePromotionCode,
} from '../services/promotion-code.service.js';

export const backofficeRouter = Router();

backofficeRouter.use(authenticate);

/* --- Specialties (editores: listar y crear especialidades/áreas; solo admin: editar/eliminar) --- */
backofficeRouter.get('/specialties', requireCaseEditor(), async (_req, res, next) => {
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

backofficeRouter.post(
  '/specialties',
  requireCaseEditor(),
  validateBody(specialtyCreateSchema),
  async (req, res, next) => {
    try {
      const s = await prisma.specialty.create({ data: { name: req.body.name } });
      await invalidateSpecialtyCache();
      res.status(201).json({ data: s });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.put(
  '/specialties/:id',
  requireAdmin(),
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

backofficeRouter.delete('/specialties/:id', requireAdmin(), async (req, res, next) => {
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
  requireCaseEditor(),
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
  requireAdmin(),
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

backofficeRouter.delete('/areas/:areaId', requireAdmin(), async (req, res, next) => {
  try {
    await prisma.area.delete({ where: { id: paramString(req.params.areaId) } });
    await invalidateSpecialtyCache();
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Phrases (admin + editor) --- */
backofficeRouter.get('/phrases', requireCaseEditor(), async (req, res, next) => {
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

backofficeRouter.post(
  '/phrases',
  requireCaseEditor(),
  validateBody(phraseCreateSchema),
  async (req, res, next) => {
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
  requireCaseEditor(),
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

backofficeRouter.delete('/phrases/:id', requireCaseEditor(), async (req, res, next) => {
  try {
    await prisma.motivationalPhrase.delete({ where: { id: paramString(req.params.id) } });
    await cacheService.invalidate('cache:phrases*');
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Flashcards (admin + editor) --- */
backofficeRouter.get('/flashcards', requireCaseEditor(), async (req, res, next) => {
  try {
    const { skip, take, page, limit } = paginationParams(
      req.query.page as string,
      req.query.limit as string
    );
    const [total, data] = await Promise.all([
      prisma.flashcard.count(),
      prisma.flashcard.findMany({
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          specialties: { include: { specialty: true } },
          areas: { include: { area: true } },
        },
      }),
    ]);
    res.json({
      data: data.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        hint: f.hint,
        isActive: f.isActive,
        specialtyIds: f.specialties.map((s) => s.specialtyId),
        areaIds: f.areas.map((a) => a.areaId),
        updatedAt: f.updatedAt.toISOString(),
      })),
      total,
      page,
      totalPages: totalPages(total, limit),
    });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post(
  '/flashcards',
  requireCaseEditor(),
  validateBody(flashcardCreateSchema),
  async (req, res, next) => {
    try {
      const b = req.body as {
        question: string;
        answer: string;
        hint?: string;
        isActive?: boolean;
        specialtyIds: string[];
        areaIds: string[];
      };
      const row = await prisma.flashcard.create({
        data: {
          question: b.question,
          answer: b.answer,
          hint: b.hint,
          isActive: b.isActive ?? true,
          specialties: { create: b.specialtyIds.map((specialtyId) => ({ specialtyId })) },
          areas: { create: b.areaIds.map((areaId) => ({ areaId })) },
        },
      });
      res.status(201).json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.put(
  '/flashcards/:id',
  requireCaseEditor(),
  validateBody(flashcardUpdateSchema),
  async (req, res, next) => {
    try {
      const flashcardId = paramString(req.params.id);
      const b = req.body as {
        question?: string;
        answer?: string;
        hint?: string;
        isActive?: boolean;
        specialtyIds?: string[];
        areaIds?: string[];
      };
      await prisma.$transaction(async (tx) => {
        await tx.flashcard.update({
          where: { id: flashcardId },
          data: {
            ...(b.question != null ? { question: b.question } : {}),
            ...(b.answer != null ? { answer: b.answer } : {}),
            ...(b.hint !== undefined ? { hint: b.hint } : {}),
            ...(b.isActive != null ? { isActive: b.isActive } : {}),
          },
        });
        if (b.specialtyIds) {
          await tx.flashcardSpecialty.deleteMany({ where: { flashcardId } });
          if (b.specialtyIds.length > 0) {
            await tx.flashcardSpecialty.createMany({
              data: b.specialtyIds.map((specialtyId) => ({ flashcardId, specialtyId })),
            });
          }
        }
        if (b.areaIds) {
          await tx.flashcardArea.deleteMany({ where: { flashcardId } });
          if (b.areaIds.length > 0) {
            await tx.flashcardArea.createMany({
              data: b.areaIds.map((areaId) => ({ flashcardId, areaId })),
            });
          }
        }
      });
      const row = await prisma.flashcard.findUnique({
        where: { id: flashcardId },
        include: { specialties: true, areas: true },
      });
      res.json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete('/flashcards/:id', requireCaseEditor(), async (req, res, next) => {
  try {
    await prisma.flashcard.delete({ where: { id: paramString(req.params.id) } });
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Exam dates (admin + editor) --- */
backofficeRouter.get('/exam-dates', requireCaseEditor(), async (req, res, next) => {
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

backofficeRouter.post(
  '/exam-dates',
  requireCaseEditor(),
  validateBody(examDateCreateSchema),
  async (req, res, next) => {
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
  }
);

backofficeRouter.put(
  '/exam-dates/:id',
  requireCaseEditor(),
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

backofficeRouter.delete('/exam-dates/:id', requireCaseEditor(), async (req, res, next) => {
  try {
    await prisma.examDate.delete({ where: { id: paramString(req.params.id) } });
    await cacheService.invalidate('cache:exam-dates*');
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Pricing --- */
backofficeRouter.get('/pricing', requireAdmin(), async (req, res, next) => {
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

backofficeRouter.post(
  '/pricing',
  requireAdmin(),
  validateBody(planCreateSchema),
  async (req, res, next) => {
    try {
      const row = await prisma.subscriptionPlan.create({ data: req.body });
      res.status(201).json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.put(
  '/pricing/:id',
  requireAdmin(),
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

backofficeRouter.delete('/pricing/:id', requireAdmin(), async (req, res, next) => {
  try {
    await prisma.subscriptionPlan.delete({ where: { id: paramString(req.params.id) } });
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Códigos de promoción (Stripe, primer periodo) --- */
backofficeRouter.get('/promotion-codes', requireAdmin(), async (_req, res, next) => {
  try {
    const data = await listPromotionCodes();
    res.json({ data });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post(
  '/promotion-codes',
  requireAdmin(),
  validateBody(promotionCodeCreateSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof promotionCodeCreateSchema>;
      const row = await createPromotionCode({
        code: body.code,
        percentOff: body.percentOff,
        maxRedemptions: body.maxRedemptions ?? null,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
      });
      res.status(201).json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.patch(
  '/promotion-codes/:id',
  requireAdmin(),
  validateBody(promotionCodePatchSchema),
  async (req, res, next) => {
    try {
      const { isActive } = req.body as z.infer<typeof promotionCodePatchSchema>;
      const row = await setPromotionCodeActive(paramString(req.params.id), isActive);
      res.json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.put(
  '/promotion-codes/:id',
  requireAdmin(),
  validateBody(promotionCodePutSchema),
  async (req, res, next) => {
    try {
      const body = req.body as z.infer<typeof promotionCodePutSchema>;
      const row = await updatePromotionCode(paramString(req.params.id), {
        code: body.code,
        percentOff: body.percentOff,
        maxRedemptions: body.maxRedemptions ?? null,
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        isActive: body.isActive,
      });
      res.json({ data: row });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete('/promotion-codes/:id', requireAdmin(), async (req, res, next) => {
  try {
    await deletePromotionCode(paramString(req.params.id));
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});

/* --- Users --- */
backofficeRouter.post(
  '/users',
  requireAdmin(),
  validateBody(backofficeUserCreateSchema),
  async (req, res, next) => {
    try {
      const result = await createUserByAdmin(req.body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.post(
  '/impersonate',
  requireAdmin(),
  validateBody(backofficeImpersonateSchema),
  async (req, res, next) => {
    try {
      if (!req.actor) throw new Error('No autenticado');
      const target = await assertImpersonableTargetUser(req.body.userId);
      await setAuthCookies(res, req.actor.id, req.actor.email, target);
      const u = await publicUser(target.userId);
      if (!u) {
        const err = new Error('Usuario no encontrado') as Error & { status: number };
        err.status = 404;
        throw err;
      }
      res.json({ data: { user: u } });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.get(
  '/users',
  requireAdmin(),
  validateQuery(backofficeUsersQuerySchema),
  async (req, res, next) => {
    try {
      const q = req.query as {
        search?: string;
        role?: 'admin' | 'editor' | 'user';
        page?: string | number;
        limit?: string | number;
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
            authProvider: true,
            roles: true,
          },
        }),
      ]);
      const profileIds = profiles.map((p) => p.id);
      const completedByUser =
        profileIds.length > 0
          ? await prisma.exam.groupBy({
              by: ['userId'],
              where: { userId: { in: profileIds }, status: 'completed' },
              _count: { _all: true },
            })
          : [];
      const examsCompletedMap = new Map(
        completedByUser.map((r) => [r.userId, r._count._all])
      );
      const data = profiles.map((p) => ({
        id: p.id,
        name: `${p.firstName} ${p.lastName}`.trim(),
        email: p.email,
        authProvider: p.authProvider,
        roles: p.roles.map((r) => r.role),
        plan: effectivePlanFromProfile(p).plan,
        status: 'active' as const,
        registeredAt: p.createdAt.toISOString(),
        lastAccess: p.updatedAt.toISOString(),
        examsCompleted: examsCompletedMap.get(p.id) ?? 0,
      }));
      const meta = paginationMeta(total, page, limit);
      res.json({ data, total, page, totalPages: meta.totalPages, meta });
    } catch (e) {
      next(e);
    }
  }
);

function adminPlanChangePasswordMatches(input: string | undefined, expected: string): boolean {
  const a = input ?? '';
  if (a.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(expected, 'utf8'));
}

backofficeRouter.patch(
  '/users/:id',
  requireAdmin(),
  validateBody(backofficeUserUpdateSchema),
  async (req, res, next) => {
    try {
      const userId = paramString(req.params.id);
      const body = req.body as {
        email?: string;
        roles?: ('admin' | 'editor' | 'user')[];
        subscriptionTier?: 'free' | 'monthly' | 'semester' | 'annual';
        confirmationPassword?: string;
      };
      const profile = await prisma.profile.findUnique({
        where: { id: userId },
        include: { roles: true },
      });
      if (!profile) {
        const err = new Error('Usuario no encontrado') as Error & { status: number };
        err.status = 404;
        throw err;
      }

      const effective = effectivePlanFromProfile(profile);
      const requestedTier = body.subscriptionTier;
      const planChangeRequested =
        requestedTier !== undefined && requestedTier !== effective.plan;

      if (planChangeRequested) {
        const pwd = body.confirmationPassword;
        if (pwd === undefined || pwd.length === 0) {
          const err = new Error(
            'Se requiere la contraseña de confirmación para cambiar el plan del usuario'
          ) as Error & { status: number };
          err.status = 400;
          throw err;
        }
        if (!adminPlanChangePasswordMatches(pwd, env.ADMIN_PLAN_CHANGE_PASSWORD)) {
          const err = new Error('Contraseña de confirmación incorrecta') as Error & { status: number };
          err.status = 403;
          throw err;
        }
      }

      const newEmail = body.email?.trim();
      if (newEmail !== undefined && newEmail !== profile.email) {
        if (profile.authProvider !== 'email') {
          const err = new Error(
            'Solo se puede cambiar el correo de cuentas registradas con email y contraseña'
          ) as Error & { status: number };
          err.status = 400;
          throw err;
        }
        const taken = await prisma.profile.findFirst({
          where: { email: newEmail, NOT: { id: userId } },
        });
        if (taken) {
          const err = new Error('Ese correo ya está en uso') as Error & { status: number };
          err.status = 409;
          throw err;
        }
      }

      const roleList = body.roles;
      const prevRolesSorted = [...profile.roles.map((r) => r.role)].sort().join(',');
      const nextRolesSorted =
        roleList !== undefined ? [...new Set(roleList)].sort().join(',') : prevRolesSorted;

      let subscriptionTier: SubscriptionTier | undefined;
      let subscriptionExpiresAt: Date | null | undefined;
      if (planChangeRequested && requestedTier !== undefined) {
        if (requestedTier === 'free') {
          subscriptionTier = 'free';
          subscriptionExpiresAt = null;
        } else {
          const pricePlan = await getActiveSubscriptionPlanForTier(requestedTier as PaidTier);
          const now = new Date();
          const base =
            profile.subscriptionExpiresAt && profile.subscriptionExpiresAt > now
              ? profile.subscriptionExpiresAt
              : now;
          subscriptionExpiresAt = new Date(base.getTime() + pricePlan.duration * 86_400_000);
          subscriptionTier = requestedTier as SubscriptionTier;
        }
      }

      await prisma.$transaction(async (tx) => {
        const profilePatch: {
          email?: string;
          subscriptionTier?: SubscriptionTier;
          subscriptionExpiresAt?: Date | null;
        } = {};
        if (newEmail !== undefined && newEmail !== profile.email) {
          profilePatch.email = newEmail;
        }
        if (planChangeRequested && subscriptionTier !== undefined) {
          profilePatch.subscriptionTier = subscriptionTier;
          profilePatch.subscriptionExpiresAt = subscriptionExpiresAt ?? null;
        }
        if (Object.keys(profilePatch).length > 0) {
          await tx.profile.update({
            where: { id: userId },
            data: profilePatch,
          });
        }
        if (roleList !== undefined && prevRolesSorted !== nextRolesSorted) {
          await tx.userRole.deleteMany({ where: { userId } });
          await tx.userRole.createMany({
            data: [...new Set(roleList)].map((role) => ({ userId, role })),
          });
        }
      });

      const p = await prisma.profile.findUnique({
        where: { id: userId },
        include: { roles: true },
      });
      res.json({
        data: {
          id: p?.id,
          email: p?.email,
          roles: p?.roles?.map((r) => r.role) ?? [],
          plan: p ? effectivePlanFromProfile(p).plan : undefined,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.put(
  '/users/:id/role',
  requireAdmin(),
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

backofficeRouter.get('/stats', requireAdmin(), async (_req, res, next) => {
  try {
    const pairKey = (specialtyId: string, areaId: string) => `${specialtyId}\0${areaId}`;

    const [
      totalUsers,
      totalExams,
      totalCases,
      totalQuestions,
      totalPublishedCases,
      specialties,
      allByPair,
      publishedByPair,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.exam.count(),
      prisma.clinicalCase.count(),
      prisma.question.count({ where: { deletedAt: null } }),
      prisma.clinicalCase.count({ where: { status: 'published' } }),
      prisma.specialty.findMany({
        select: {
          id: true,
          name: true,
          areas: { select: { id: true, name: true }, orderBy: { name: 'asc' } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.clinicalCase.groupBy({
        by: ['specialtyId', 'areaId'],
        _count: { _all: true },
      }),
      prisma.clinicalCase.groupBy({
        by: ['specialtyId', 'areaId'],
        where: { status: 'published' },
        _count: { _all: true },
      }),
    ]);

    const allMap = new Map(
      allByPair.map((r) => [pairKey(r.specialtyId, r.areaId), r._count._all])
    );
    const pubMap = new Map(
      publishedByPair.map((r) => [pairKey(r.specialtyId, r.areaId), r._count._all])
    );

    const catalogAreaKeys = new Set<string>();
    for (const s of specialties) {
      for (const a of s.areas) {
        catalogAreaKeys.add(pairKey(s.id, a.id));
      }
    }

    const orphans: { specialtyId: string; areaId: string }[] = [];
    for (const r of allByPair) {
      const k = pairKey(r.specialtyId, r.areaId);
      if (!catalogAreaKeys.has(k)) {
        orphans.push({ specialtyId: r.specialtyId, areaId: r.areaId });
      }
    }

    const orphanSpecIds = [...new Set(orphans.map((o) => o.specialtyId))];
    const orphanAreaIds = [...new Set(orphans.map((o) => o.areaId))];
    const [orphanSpecs, orphanAreas] = await Promise.all([
      orphanSpecIds.length
        ? prisma.specialty.findMany({
            where: { id: { in: orphanSpecIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([] as { id: string; name: string }[]),
      orphanAreaIds.length
        ? prisma.area.findMany({
            where: { id: { in: orphanAreaIds } },
            select: { id: true, name: true, specialtyId: true },
          })
        : Promise.resolve([] as { id: string; name: string; specialtyId: string }[]),
    ]);
    const specNameById = new Map(orphanSpecs.map((s) => [s.id, s.name]));
    const areaMetaById = new Map(orphanAreas.map((a) => [a.id, a]));

    const caseDistribution = specialties.map((spec) => {
      const areas = spec.areas.map((area) => {
        const k = pairKey(spec.id, area.id);
        return {
          areaId: area.id,
          areaName: area.name,
          totalCases: allMap.get(k) ?? 0,
          publishedCases: pubMap.get(k) ?? 0,
        };
      });
      const totalCasesSpec = areas.reduce((acc, a) => acc + a.totalCases, 0);
      const publishedCasesSpec = areas.reduce((acc, a) => acc + a.publishedCases, 0);
      return {
        specialtyId: spec.id,
        specialtyName: spec.name,
        totalCases: totalCasesSpec,
        publishedCases: publishedCasesSpec,
        areas,
      };
    });

    const distBySpecId = new Map(caseDistribution.map((row) => [row.specialtyId, row]));

    if (orphans.length > 0) {
      const bySpec = new Map<string, typeof orphans>();
      for (const o of orphans) {
        const list = bySpec.get(o.specialtyId) ?? [];
        list.push(o);
        bySpec.set(o.specialtyId, list);
      }
      for (const [specId, pairs] of bySpec) {
        const existing = distBySpecId.get(specId);
        const areaRows = pairs.map((o) => {
          const k = pairKey(o.specialtyId, o.areaId);
          const meta = areaMetaById.get(o.areaId);
          return {
            areaId: o.areaId,
            areaName: meta?.name ?? '(área sin catálogo)',
            totalCases: allMap.get(k) ?? 0,
            publishedCases: pubMap.get(k) ?? 0,
          };
        });
        if (existing) {
          const seen = new Set(existing.areas.map((a) => a.areaId));
          for (const row of areaRows) {
            if (seen.has(row.areaId)) continue;
            seen.add(row.areaId);
            existing.areas.push(row);
            existing.totalCases += row.totalCases;
            existing.publishedCases += row.publishedCases;
          }
          existing.areas.sort((a, b) => a.areaName.localeCompare(b.areaName, 'es'));
        } else {
          areaRows.sort((a, b) => a.areaName.localeCompare(b.areaName, 'es'));
          const totalCasesSpec = areaRows.reduce((acc, a) => acc + a.totalCases, 0);
          const publishedCasesSpec = areaRows.reduce((acc, a) => acc + a.publishedCases, 0);
          const row = {
            specialtyId: specId,
            specialtyName: specNameById.get(specId) ?? '(especialidad sin catálogo)',
            totalCases: totalCasesSpec,
            publishedCases: publishedCasesSpec,
            areas: areaRows,
          };
          caseDistribution.push(row);
          distBySpecId.set(specId, row);
        }
      }
      caseDistribution.sort((a, b) =>
        a.specialtyName.localeCompare(b.specialtyName, 'es')
      );
    }

    const now = new Date();
    const [activeSubscribersByTier, tierPlansForPricing] = await Promise.all([
      prisma.profile.groupBy({
        by: ['subscriptionTier'],
        where: {
          subscriptionTier: { not: 'free' },
          subscriptionExpiresAt: { gt: now },
        },
        _count: { _all: true },
      }),
      prisma.subscriptionPlan.findMany({
        where: { isActive: true, tier: { in: [...PAID_TIERS] } },
        select: { tier: true, price: true, duration: true },
        orderBy: { price: 'asc' },
      }),
    ]);

    const countByTier = new Map(
      activeSubscribersByTier.map((r) => [r.subscriptionTier, r._count._all])
    );
    const monthlySubscribers = countByTier.get('monthly') ?? 0;
    const semesterSubscribers = countByTier.get('semester') ?? 0;
    const annualSubscribers = countByTier.get('annual') ?? 0;
    const activeUsers = monthlySubscribers + semesterSubscribers + annualSubscribers;
    const freeUsers = Math.max(0, totalUsers - activeUsers);

    const bestPlanByTier = new Map<PaidTier, { price: number; duration: number }>();
    for (const p of tierPlansForPricing) {
      if (!p.tier || p.tier === 'free') continue;
      const t = p.tier as PaidTier;
      const cur = bestPlanByTier.get(t);
      if (!cur || p.price < cur.price) {
        bestPlanByTier.set(t, { price: p.price, duration: Math.max(1, p.duration) });
      }
    }

    const mrrFromPlan = (price: number, durationDays: number) => (price * 30) / durationDays;

    let estimatedRevenue = 0;
    for (const tier of PAID_TIERS) {
      const n = countByTier.get(tier) ?? 0;
      if (n === 0) continue;
      const fromDb = bestPlanByTier.get(tier);
      const mrr = fromDb
        ? mrrFromPlan(fromDb.price, fromDb.duration)
        : mrrFromPlan(TIER_CHECKOUT[tier].amountCents / 100, TIER_CHECKOUT[tier].durationDays);
      estimatedRevenue += n * mrr;
    }
    estimatedRevenue = Math.round(estimatedRevenue);

    res.json({
      data: {
        totalUsers,
        totalExams,
        totalCases,
        totalPublishedCases,
        totalQuestions,
        caseDistribution,
        activeUsers,
        freeUsers,
        monthlySubscribers,
        semesterSubscribers,
        annualSubscribers,
        estimatedRevenue,
        avgAccuracy: 0,
        abandonRate: 0,
      },
    });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.get(
  '/exam-reviews',
  requireCaseEditor(),
  validateQuery(examReviewsQuerySchema),
  async (req, res, next) => {
    try {
      const q = req.query as z.infer<typeof examReviewsQuerySchema>;
      const result = await listPendingMentorReviews(q.page, q.limit);
      res.json({ data: result });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.get(
  '/exam-reviews/:examId',
  requireCaseEditor(),
  async (req, res, next) => {
    try {
      const result = await getMentorReviewExamDetail(paramString(req.params.examId));
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.patch(
  '/exam-reviews/:examId',
  requireCaseEditor(),
  validateBody(examReviewSubmitSchema),
  async (req, res, next) => {
    try {
      if (!req.actor) throw new Error('No user');
      const result = await submitMentorReview(paramString(req.params.examId), req.actor.id, req.body);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.get(
  '/subscription-cancellation-feedback',
  requireAdmin(),
  async (_req, res, next) => {
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
  }
);

backofficeRouter.get('/admin-push', requireAdmin(), async (req, res, next) => {
  try {
    if (!req.actor) throw new Error('No user');
    const prefs = await getAdminPushPreferences(req.actor.id);
    res.json({
      data: {
        pushConfigured: isAdminPushConfigured(),
        smtpConfigured: isSmtpConfigured(),
        vapidPublicKey: getVapidPublicKey(),
        notifyNewUser: prefs?.adminPushNotifyNewUser ?? true,
        notifyNewSubscription: prefs?.adminPushNotifyNewSubscription ?? true,
        emailNotifyNewUser: prefs?.adminEmailNotifyNewUser ?? false,
        emailNotifyNewSubscription: prefs?.adminEmailNotifyNewSubscription ?? false,
      },
    });
  } catch (e) {
    next(e);
  }
});

backofficeRouter.post(
  '/admin-push/subscription',
  requireAdmin(),
  validateBody(adminPushSubscribeSchema),
  async (req, res, next) => {
    try {
      if (!req.actor) throw new Error('No user');
      if (!isAdminPushConfigured()) {
        res.status(503).json({ error: 'Web Push no está configurado en el servidor (VAPID)' });
        return;
      }
      await subscribeAdminPush(req.actor.id, req.body);
      res.status(201).json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.delete(
  '/admin-push/subscription',
  requireAdmin(),
  validateBody(adminPushUnsubscribeSchema),
  async (req, res, next) => {
    try {
      if (!req.actor) throw new Error('No user');
      await unsubscribeAdminPush(req.actor.id, req.body.endpoint);
      res.json({ data: { ok: true } });
    } catch (e) {
      next(e);
    }
  }
);

backofficeRouter.patch(
  '/admin-push/preferences',
  requireAdmin(),
  validateBody(adminPushPreferencesSchema),
  async (req, res, next) => {
    try {
      if (!req.actor) throw new Error('No user');
      const updated = await updateAdminPushPreferences(req.actor.id, {
        notifyNewUser: req.body.notifyNewUser,
        notifyNewSubscription: req.body.notifyNewSubscription,
        emailNotifyNewUser: req.body.emailNotifyNewUser,
        emailNotifyNewSubscription: req.body.emailNotifyNewSubscription,
      });
      res.json({ data: updated });
    } catch (e) {
      next(e);
    }
  }
);
