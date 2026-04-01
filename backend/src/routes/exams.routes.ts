import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { examAnswerSchema, examTimeSchema, generateExamSchema } from '../schemas/exam.schema.js';
import * as examService from '../services/exam.service.js';
import { invalidateUserStats } from '../services/stats.service.js';
import { paramString } from '../utils/params.js';

export const examsRouter = Router();

examsRouter.post(
  '/generate',
  authenticate,
  validateBody(generateExamSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new Error('No user');
      const result = await examService.generateExam(req.user.id, req.body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

examsRouter.post(
  '/start',
  authenticate,
  validateBody(generateExamSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new Error('No user');
      const result = await examService.generateExam(req.user.id, req.body);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

examsRouter.get('/', authenticate, async (req, res, next) => {
  try {
    if (!req.user) throw new Error('No user');
    const page = parseInt(String(req.query.page ?? '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
    const result = await examService.listExams(req.user.id, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

examsRouter.get('/:id/results', authenticate, async (req, res, next) => {
  try {
    if (!req.user) throw new Error('No user');
    const result = await examService.getExamResults(req.user.id, paramString(req.params.id));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

examsRouter.get('/:id/next-question', authenticate, async (req, res, next) => {
  try {
    if (!req.user) throw new Error('No user');
    const result = await examService.getNextQuestion(req.user.id, paramString(req.params.id));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

examsRouter.put(
  '/:id/answer',
  authenticate,
  validateBody(examAnswerSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new Error('No user');
      const result = await examService.submitAnswer(req.user.id, paramString(req.params.id), req.body);
      await invalidateUserStats(req.user.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

examsRouter.put(
  '/:id/complete',
  authenticate,
  validateBody(examTimeSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new Error('No user');
      const result = await examService.completeExam(
        req.user.id,
        paramString(req.params.id),
        req.body.timeSpentSeconds
      );
      await invalidateUserStats(req.user.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

examsRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    if (!req.user) throw new Error('No user');
    const result = await examService.getExamById(req.user.id, paramString(req.params.id));
    res.json(result);
  } catch (e) {
    next(e);
  }
});
