import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin, requireCaseEditor } from '../middleware/roles.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createCaseSchema,
  listCasesQuerySchema,
  updateCaseSchema,
} from '../schemas/case.schema.js';
import * as caseService from '../services/case.service.js';
import { processBulkUpload } from '../services/bulkUpload.service.js';
import { paramString } from '../utils/params.js';

export const casesRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

casesRouter.get(
  '/',
  authenticate,
  requireCaseEditor(),
  validateQuery(listCasesQuerySchema),
  async (req, res, next) => {
    try {
      const result = await caseService.listCases(req.query as {
        specialty?: string;
        area?: string;
        status?: string;
        page?: number;
        limit?: number;
      });
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

casesRouter.get('/:id', authenticate, requireCaseEditor(), async (req, res, next) => {
  try {
    const result = await caseService.getCaseById(paramString(req.params.id));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

casesRouter.post(
  '/',
  authenticate,
  requireCaseEditor(),
  validateBody(createCaseSchema),
  async (req, res, next) => {
    try {
      const result = await caseService.createCase(req.body, req.user!.id);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

casesRouter.put(
  '/:id',
  authenticate,
  requireCaseEditor(),
  validateBody(updateCaseSchema),
  async (req, res, next) => {
    try {
      const result = await caseService.updateCase(paramString(req.params.id), req.body, req.user!.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

casesRouter.delete('/:id', authenticate, requireAdmin(), async (req, res, next) => {
  try {
    const result = await caseService.deleteCase(paramString(req.params.id));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

casesRouter.post(
  '/bulk-upload',
  authenticate,
  requireAdmin(),
  upload.single('file'),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file?.buffer) {
        res.status(400).json({ error: 'Archivo requerido' });
        return;
      }
      const result = await processBulkUpload(file.buffer, req.user!.id);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);
