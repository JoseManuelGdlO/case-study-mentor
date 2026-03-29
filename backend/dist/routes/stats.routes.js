import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as statsService from '../services/stats.service.js';
export const statsRouter = Router();
statsRouter.get('/', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const result = await statsService.getUserStats(req.user.id);
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=stats.routes.js.map