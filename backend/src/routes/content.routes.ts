import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../config/database.js';
import { cacheService } from '../services/cache.service.js';

/** Invalidated by backoffice `invalidate('cache:phrases*')`. */
const PHRASES_ACTIVE_CACHE_KEY = 'cache:phrases:active';
/** Invalidated by backoffice `invalidate('cache:exam-dates*')`. */
const EXAM_DATE_ACTIVE_CACHE_KEY = 'cache:exam-dates:active';
const BANNER_CACHE_TTL_SEC = 60;

type PhraseRow = {
  id: string;
  text: string;
  author: string;
  isActive: boolean;
  createdAt: string;
};

type ActiveExamDateRow = {
  id: string;
  name: string;
  date: string;
  isActive: boolean;
};

type ExamDateCachePayload = { active: ActiveExamDateRow | null };

export const contentRouter = Router();

/**
 * Active motivational phrases + single active exam date for student UI.
 * If multiple exam dates are active, returns the nearest upcoming by calendar date.
 */
contentRouter.get('/banner', authenticate, async (_req, res, next) => {
  try {
    let phrases = await cacheService.get<PhraseRow[]>(PHRASES_ACTIVE_CACHE_KEY);
    if (!phrases) {
      const rows = await prisma.motivationalPhrase.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
      phrases = rows.map((p) => ({
        id: p.id,
        text: p.text,
        author: p.author,
        isActive: p.isActive,
        createdAt: p.createdAt.toISOString(),
      }));
      await cacheService.set(PHRASES_ACTIVE_CACHE_KEY, phrases, BANNER_CACHE_TTL_SEC);
    }

    let activeExamDate: ActiveExamDateRow | null;
    const examCached = await cacheService.get<ExamDateCachePayload>(EXAM_DATE_ACTIVE_CACHE_KEY);
    if (examCached && 'active' in examCached) {
      activeExamDate = examCached.active;
    } else {
      const examRow = await prisma.examDate.findFirst({
        where: { isActive: true },
        orderBy: { date: 'asc' },
      });
      activeExamDate = examRow
        ? {
            id: examRow.id,
            name: examRow.name,
            date: examRow.date.toISOString(),
            isActive: examRow.isActive,
          }
        : null;
      await cacheService.set(
        EXAM_DATE_ACTIVE_CACHE_KEY,
        { active: activeExamDate } satisfies ExamDateCachePayload,
        BANNER_CACHE_TTL_SEC
      );
    }

    res.json({
      data: {
        phrases,
        activeExamDate,
      },
    });
  } catch (e) {
    next(e);
  }
});
