import type { NextFunction, Request, Response } from 'express';
/**
 * Permite acceso solo a usuarios con suscripción activa.
 * Staff (admin/editor) puede pasar para gestionar contenido sin pagar plan.
 */
export declare function requirePaidAccess(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=subscription.d.ts.map