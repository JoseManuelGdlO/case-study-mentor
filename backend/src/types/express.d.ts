import type { AppRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /** Real signed-in account (JWT `sub`). */
      actor?: { id: string; email: string };
      /** Effective user for portal APIs (impersonated student or same as actor). */
      user?: { id: string; email: string };
      roles?: AppRole[];
    }
  }
}

export {};
