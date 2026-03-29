import type { NextFunction, Request, Response } from 'express';
export declare function stripeWebhookHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function paypalWebhookHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare const paymentsRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=payments.routes.d.ts.map