import { redis } from '../config/redis.js';
import { sessionActiveKey } from '../services/auth.service.js';
import { verifyAccessToken } from '../utils/jwt.js';
export function authenticate(req, res, next) {
    void (async () => {
        const token = req.cookies?.accessToken;
        if (!token) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        try {
            const payload = verifyAccessToken(token);
            const current = await redis.get(sessionActiveKey(payload.sub));
            if (current !== payload.jti) {
                res.status(401).json({ error: 'Sesión revocada' });
                return;
            }
            req.user = { id: payload.sub, email: payload.email };
            next();
        }
        catch {
            res.status(401).json({ error: 'Token inválido' });
        }
    })().catch(() => {
        if (!res.headersSent) {
            res.status(401).json({ error: 'No autenticado' });
        }
    });
}
export function optionalAuthenticate(req, _res, next) {
    void (async () => {
        const token = req.cookies?.accessToken;
        if (token) {
            try {
                const payload = verifyAccessToken(token);
                const current = await redis.get(sessionActiveKey(payload.sub));
                if (current === payload.jti) {
                    req.user = { id: payload.sub, email: payload.email };
                }
            }
            catch {
                /* ignore */
            }
        }
        next();
    })().catch(next);
}
//# sourceMappingURL=auth.js.map