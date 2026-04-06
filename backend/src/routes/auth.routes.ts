import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  registerSchema,
} from '../schemas/auth.schema.js';
import * as authService from '../services/auth.service.js';

export const authRouter = Router();

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler(_req, res) {
    res.status(429).json({ error: 'Demasiados intentos de recuperación. Prueba de nuevo más tarde.' });
  },
});

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

authRouter.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await authService.requestPasswordReset(req.body.email);
      res.json(result);
    } catch (e) {
      next(e);
    }
  }
);

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

authRouter.post('/impersonate/stop', authenticate, async (req, res, next) => {
  try {
    if (!req.actor || !req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    if (req.actor.id === req.user.id) {
      res.status(400).json({ error: 'No estás en modo vista de estudiante' });
      return;
    }
    await authService.setAuthCookies(res, req.actor.id, req.actor.email);
    const u = await authService.publicUser(req.actor.id);
    if (!u) {
      res.status(500).json({ error: 'Error al restaurar sesión' });
      return;
    }
    res.json({ data: { user: u } });
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
