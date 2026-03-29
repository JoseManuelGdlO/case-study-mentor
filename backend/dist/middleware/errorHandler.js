import { ZodError } from 'zod';
export function errorHandler(err, _req, res, _next) {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Validación fallida',
            details: err.flatten(),
        });
        return;
    }
    const message = err instanceof Error ? err.message : 'Error interno';
    const status = err && typeof err === 'object' && 'status' in err && typeof err.status === 'number'
        ? err.status
        : 500;
    if (status >= 500) {
        console.error(err);
    }
    res.status(status).json({
        error: message,
        details: process.env.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined,
    });
}
//# sourceMappingURL=errorHandler.js.map