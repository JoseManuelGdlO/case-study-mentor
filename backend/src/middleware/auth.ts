import type { NextFunction, Request, Response } from 'express';
import { redis } from '../config/redis.js';
import { sessionActiveKey } from '../services/auth.service.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  void (async () => {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      const current = await redis.get(sessionActiveKey(payload.sub));
      if (current !== payload.jti) {
        res.status(401).json({ error: 'Sesión revocada' });
        return;
      }
      req.user = { id: payload.sub, email: payload.email };
      next();
    } catch {
      res.status(401).json({ error: 'Token inválido' });
    }
  })().catch(() => {
    if (!res.headersSent) {
      res.status(401).json({ error: 'No autenticado' });
    }
  });
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  void (async () => {
    const token = req.cookies?.accessToken as string | undefined;
    if (token) {
      try {
        const payload = verifyAccessToken(token);
        const current = await redis.get(sessionActiveKey(payload.sub));
        if (current === payload.jti) {
          req.user = { id: payload.sub, email: payload.email };
        }
      } catch {
        /* ignore */
      }
    }
    next();
  })().catch(next);
}
