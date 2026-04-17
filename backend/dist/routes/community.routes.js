import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireCaseEditor } from '../middleware/roles.js';
import { requirePaidAccess } from '../middleware/subscription.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createCommunityPostSchema, createCommunityThreadSchema, listCommunityThreadsQuerySchema, moderateCommunityPostSchema, } from '../schemas/community.schema.js';
import * as communityService from '../services/community.service.js';
import { paramString } from '../utils/params.js';
export const communityRouter = Router();
communityRouter.get('/threads', authenticate, requirePaidAccess, validateQuery(listCommunityThreadsQuerySchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const roles = req.roles ?? ['user'];
        const result = await communityService.listThreads({
            userId: req.user.id,
            specialtyId: paramString(req.query.specialtyId) || undefined,
            search: paramString(req.query.search) || undefined,
            sort: req.query.sort ?? 'recent',
            page: Number(req.query.page ?? 1),
            limit: Number(req.query.limit ?? 20),
            roles,
        });
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
communityRouter.post('/threads', authenticate, requirePaidAccess, validateBody(createCommunityThreadSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await communityService.createThread(req.user.id, req.body);
        res.status(201).json(result);
    }
    catch (e) {
        next(e);
    }
});
communityRouter.get('/threads/:threadId', authenticate, requirePaidAccess, async (req, res, next) => {
    try {
        const roles = req.roles ?? ['user'];
        const result = await communityService.getThreadById(paramString(req.params.threadId), roles);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
communityRouter.post('/threads/:threadId/posts', authenticate, requirePaidAccess, validateBody(createCommunityPostSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await communityService.createPost(req.user.id, paramString(req.params.threadId), req.body);
        res.status(201).json(result);
    }
    catch (e) {
        next(e);
    }
});
communityRouter.patch('/posts/:postId/moderation', authenticate, requirePaidAccess, requireCaseEditor(), validateBody(moderateCommunityPostSchema), async (req, res, next) => {
    try {
        const result = await communityService.moderatePost(paramString(req.params.postId), req.body.isHidden);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=community.routes.js.map