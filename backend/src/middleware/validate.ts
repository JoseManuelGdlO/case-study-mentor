import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

type Schema = ZodTypeAny;

export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      res.status(400).json({ error: 'Validación fallida', details: result.error.flatten() });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({ error: 'Validación fallida', details: result.error.flatten() });
      return;
    }
    req.query = result.data as Request['query'];
    next();
  };
}
