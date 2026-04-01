import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { paramString } from '../utils/params.js';
import { completeStudyPlanTaskSchema } from '../schemas/study-plan.schema.js';
import * as studyPlanService from '../services/study-plan.service.js';
export const studyPlanRouter = Router();
studyPlanRouter.get('/today', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await studyPlanService.getTodayStudyPlan(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
studyPlanRouter.post('/today/regenerate', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await studyPlanService.regenerateTodayStudyPlan(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
studyPlanRouter.post('/:id/task/:taskId/complete', authenticate, validateBody(completeStudyPlanTaskSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await studyPlanService.completeStudyPlanTask(req.user.id, paramString(req.params.id), paramString(req.params.taskId), req.body);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
studyPlanRouter.get('/impact', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await studyPlanService.getStudyPlanImpact(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=study-plan.routes.js.map