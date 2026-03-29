export function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body ?? {});
        if (!result.success) {
            res.status(400).json({ error: 'Validación fallida', details: result.error.flatten() });
            return;
        }
        req.body = result.data;
        next();
    };
}
export function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            res.status(400).json({ error: 'Validación fallida', details: result.error.flatten() });
            return;
        }
        req.query = result.data;
        next();
    };
}
//# sourceMappingURL=validate.js.map