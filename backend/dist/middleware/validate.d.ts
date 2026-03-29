import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';
type Schema = ZodTypeAny;
export declare function validateBody(schema: Schema): (req: Request, res: Response, next: NextFunction) => void;
export declare function validateQuery(schema: Schema): (req: Request, res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=validate.d.ts.map