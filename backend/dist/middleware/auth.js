import { verifyAccessToken } from '../utils/jwt.js';
export function authenticate(req, res, next) {
    const token = req.cookies?.accessToken;
    if (!token) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }
    try {
        const payload = verifyAccessToken(token);
        req.user = { id: payload.sub, email: payload.email };
        next();
    }
    catch {
        res.status(401).json({ error: 'Token inválido' });
    }
}
export function optionalAuthenticate(req, _res, next) {
    const token = req.cookies?.accessToken;
    if (token) {
        try {
            const payload = verifyAccessToken(token);
            req.user = { id: payload.sub, email: payload.email };
        }
        catch {
            /* ignore */
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map