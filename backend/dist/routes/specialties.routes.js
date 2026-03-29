import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as specialtyService from '../services/specialty.service.js';
export const specialtiesRouter = Router();
specialtiesRouter.get('/', authenticate, async (_req, res, next) => {
    try {
        const result = await specialtyService.getSpecialtyTree();
        res.json(result);
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=specialties.routes.js.map