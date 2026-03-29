import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { googleAuthSchema, loginSchema, registerSchema } from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';

export const authRouter = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register
 */
authRouter.post('/register', validateBody(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body, res);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.login(req.body, res);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refresh = req.cookies?.refreshToken as string | undefined;
    const result = await authService.refreshTokens(refresh, res);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const refresh = req.cookies?.refreshToken as string | undefined;
    const result = await authService.logout(refresh, res);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

authRouter.post('/google', validateBody(googleAuthSchema), async (req, res, next) => {
  try {
    const result = await authService.googleAuth(req.body.idToken, res);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
