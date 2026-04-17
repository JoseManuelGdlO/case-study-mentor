import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireCaseEditor } from '../middleware/roles.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createMentorshipRequestSchema, listMentorshipRequestsQuerySchema, updateMentorshipStatusSchema, } from '../schemas/mentorship.schema.js';
import * as mentorshipService from '../services/mentorship.service.js';
import { paramString } from '../utils/params.js';
export const mentorshipRouter = Router();
mentorshipRouter.post('/requests', authenticate, validateBody(createMentorshipRequestSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await mentorshipService.createRequest(req.user.id, req.body);
        res.status(201).json(result);
    }
    catch (e) {
        next(e);
    }
});
mentorshipRouter.get('/requests/mine', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await mentorshipService.listMine(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
mentorshipRouter.get('/requests', authenticate, requireCaseEditor(), validateQuery(listMentorshipRequestsQuerySchema), async (req, res, next) => {
    try {
        const result = await mentorshipService.listForStaff({
            status: req.query.status,
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 20),
        });
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
mentorshipRouter.patch('/requests/:requestId/status', authenticate, requireCaseEditor(), validateBody(updateMentorshipStatusSchema), async (req, res, next) => {
    try {
        if (!req.actor)
            throw new Error('No actor');
        const result = await mentorshipService.updateStatus(paramString(req.params.requestId), req.actor.id, req.body);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=mentorship.routes.js.map