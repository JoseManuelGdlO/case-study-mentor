import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { changePasswordSchema, profileUpdateSchema } from '../schemas/profile.schema.js';
import * as profileService from '../services/profile.service.js';
export const profileRouter = Router();
profileRouter.get('/', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await profileService.getProfile(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
profileRouter.put('/', authenticate, validateBody(profileUpdateSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await profileService.updateProfile(req.user.id, req.body);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
profileRouter.post('/password', authenticate, validateBody(changePasswordSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { currentPassword, newPassword } = req.body;
        const result = await profileService.changePassword(req.user.id, {
            currentPassword,
            newPassword,
        });
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
profileRouter.put('/onboarding', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await profileService.completeOnboarding(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=profile.routes.js.map