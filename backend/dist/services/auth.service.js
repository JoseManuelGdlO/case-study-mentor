import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { effectivePlanFromProfile } from './profile.service.js';
import { REFRESH_TTL_SEC, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
const BCRYPT_ROUNDS = 12;
const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';
function cookieBase() {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    };
}
function refreshRedisKey(userId, jti) {
    return `refresh:${userId}:${jti}`;
}
export async function setAuthCookies(res, userId, email) {
    const access = signAccessToken(userId, email);
    const { token: refresh, jti } = signRefreshToken(userId);
    await redis.setex(refreshRedisKey(userId, jti), REFRESH_TTL_SEC, '1');
    const base = cookieBase();
    res.cookie(ACCESS_COOKIE, access, { ...base, maxAge: 15 * 60 * 1000 });
    res.cookie(REFRESH_COOKIE, refresh, { ...base, maxAge: REFRESH_TTL_SEC * 1000 });
}
export function clearAuthCookies(res) {
    const base = cookieBase();
    res.clearCookie(ACCESS_COOKIE, base);
    res.clearCookie(REFRESH_COOKIE, base);
}
async function publicUser(userId) {
    const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            university: true,
            graduationYear: true,
            examDate: true,
            avatarUrl: true,
            onboardingDone: true,
            subscriptionTier: true,
            subscriptionExpiresAt: true,
            roles: { select: { role: true } },
        },
    });
    if (!profile)
        return null;
    const { plan, subscriptionExpiresAt } = effectivePlanFromProfile(profile);
    return {
        id: profile.id,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        university: profile.university,
        graduationYear: profile.graduationYear,
        examDate: profile.examDate?.toISOString() ?? null,
        avatarUrl: profile.avatarUrl,
        onboardingDone: profile.onboardingDone,
        roles: profile.roles.map((r) => r.role),
        plan,
        subscriptionExpiresAt,
    };
}
export async function register(data, res) {
    const existing = await prisma.profile.findUnique({ where: { email: data.email } });
    if (existing) {
        const err = new Error('El correo ya está registrado');
        err.status = 409;
        throw err;
    }
    const hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await prisma.profile.create({
        data: {
            email: data.email,
            password: hash,
            firstName: data.firstName,
            lastName: data.lastName,
            roles: { create: { role: 'user' } },
        },
    });
    await setAuthCookies(res, user.id, user.email);
    const u = await publicUser(user.id);
    return { data: { user: u, isNewUser: true } };
}
export async function login(data, res) {
    const user = await prisma.profile.findUnique({ where: { email: data.email } });
    if (!user) {
        const err = new Error('Credenciales inválidas');
        err.status = 401;
        throw err;
    }
    const ok = await bcrypt.compare(data.password, user.password);
    if (!ok) {
        const err = new Error('Credenciales inválidas');
        err.status = 401;
        throw err;
    }
    await setAuthCookies(res, user.id, user.email);
    const u = await publicUser(user.id);
    return { data: { user: u, isNewUser: false } };
}
export async function refreshTokens(refreshCookie, res) {
    if (!refreshCookie) {
        const err = new Error('No autenticado');
        err.status = 401;
        throw err;
    }
    let payload;
    try {
        payload = verifyRefreshToken(refreshCookie);
    }
    catch {
        const err = new Error('Token inválido');
        err.status = 401;
        throw err;
    }
    const key = refreshRedisKey(payload.sub, payload.jti);
    const exists = await redis.get(key);
    if (!exists) {
        const err = new Error('Sesión revocada');
        err.status = 401;
        throw err;
    }
    await redis.del(key);
    const profile = await prisma.profile.findUnique({ where: { id: payload.sub } });
    if (!profile) {
        const err = new Error('Usuario no encontrado');
        err.status = 401;
        throw err;
    }
    await setAuthCookies(res, profile.id, profile.email);
    const u = await publicUser(profile.id);
    return { data: { user: u } };
}
export async function logout(refreshCookie, res) {
    if (refreshCookie) {
        try {
            const payload = verifyRefreshToken(refreshCookie);
            await redis.del(refreshRedisKey(payload.sub, payload.jti));
        }
        catch {
            /* ignore */
        }
    }
    clearAuthCookies(res);
    return { data: { ok: true } };
}
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
export async function googleAuth(idToken, res) {
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
        const err = new Error('Token de Google inválido');
        err.status = 400;
        throw err;
    }
    const email = payload.email;
    let user = await prisma.profile.findUnique({ where: { email } });
    let isNewUser = false;
    if (!user) {
        const randomPass = await bcrypt.hash(randomUUID(), BCRYPT_ROUNDS);
        user = await prisma.profile.create({
            data: {
                email,
                password: randomPass,
                firstName: payload.given_name ?? 'Usuario',
                lastName: payload.family_name ?? '',
                roles: { create: { role: 'user' } },
            },
        });
        isNewUser = true;
    }
    await setAuthCookies(res, user.id, user.email);
    const u = await publicUser(user.id);
    return { data: { user: u, isNewUser } };
}
//# sourceMappingURL=auth.service.js.map