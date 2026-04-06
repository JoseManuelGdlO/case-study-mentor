/**
 * Access tokens carry `jti` (shared with the refresh token); the API checks it against Redis `session:active:${userId}`.
 * Deploy: tokens issued before that field existed are rejected; affected users must sign in again.
 */
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
function normalizeImpersonation(imp, impEmail) {
    const hasImp = typeof imp === 'string' && imp.length > 0;
    const hasEmail = typeof impEmail === 'string' && impEmail.length > 0;
    if (hasImp !== hasEmail)
        throw new Error('Invalid impersonation claims');
    if (hasImp && hasEmail)
        return { userId: imp, email: impEmail };
    return undefined;
}
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '7d';
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;
/** Access and refresh share the same `jti` so the server can enforce one session per user (see session:active in Redis). */
export function signAccessToken(userId, email, jti, impersonation) {
    const payload = {
        sub: userId,
        email,
        jti,
        type: 'access',
        ...(impersonation ? { imp: impersonation.userId, impEmail: impersonation.email } : {}),
    };
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}
export function signRefreshToken(userId, jti, impersonation) {
    const payload = {
        sub: userId,
        jti,
        type: 'refresh',
        ...(impersonation ? { imp: impersonation.userId, impEmail: impersonation.email } : {}),
    };
    const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
    return { token, jti };
}
export function verifyAccessToken(token) {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (decoded.type !== 'access')
        throw new Error('Invalid token type');
    if (typeof decoded.jti !== 'string' || !decoded.jti)
        throw new Error('Invalid token');
    normalizeImpersonation(decoded.imp, decoded.impEmail);
    return decoded;
}
export function verifyRefreshToken(token) {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh')
        throw new Error('Invalid token type');
    normalizeImpersonation(decoded.imp, decoded.impEmail);
    return decoded;
}
export function impersonationFromPayload(payload) {
    return normalizeImpersonation(payload.imp, payload.impEmail);
}
export { REFRESH_TTL_SEC };
//# sourceMappingURL=jwt.js.map