import type { NextFunction, Request, Response } from 'express';
import type { AppRole } from '@prisma/client';
import { prisma } from '../config/database.js';

export function requireRole(...roles: AppRole[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const principalId = req.actor?.id;
    if (!principalId) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    const userRoles = await prisma.userRole.findMany({ where: { userId: principalId } });
    const hasRole = userRoles.some((ur) => roles.includes(ur.role));
    if (!hasRole) {
      res.status(403).json({ error: 'Sin permisos' });
      return;
    }
    req.roles = userRoles.map((r) => r.role);
    next();
  };
}

/** admin or editor */
export function requireCaseEditor() {
  return requireRole('admin', 'editor');
}

export function requireAdmin() {
  return requireRole('admin');
}
