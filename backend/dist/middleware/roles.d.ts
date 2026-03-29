import type { NextFunction, Request, Response } from 'express';
import type { AppRole } from '@prisma/client';
export declare function requireRole(...roles: AppRole[]): (req: Request, res: Response, next: NextFunction) => Promise<void>;
/** admin or editor */
export declare function requireCaseEditor(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function requireAdmin(): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=roles.d.ts.map