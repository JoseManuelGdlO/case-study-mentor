import type { AppRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      roles?: AppRole[];
    }
  }
}

export {};
