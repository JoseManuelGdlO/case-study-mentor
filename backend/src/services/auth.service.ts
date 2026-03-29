import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import type { Response } from 'express';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { REFRESH_TTL_SEC, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const BCRYPT_ROUNDS = 12;
const ACCESS_COOKIE = 'accessToken';
const REFRESH_COOKIE = 'refreshToken';

function cookieBase() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

function refreshRedisKey(userId: string, jti: string): string {
  return `refresh:${userId}:${jti}`;
}

export async function setAuthCookies(res: Response, userId: string, email: string): Promise<void> {
  const access = signAccessToken(userId, email);
  const { token: refresh, jti } = signRefreshToken(userId);
  await redis.setex(refreshRedisKey(userId, jti), REFRESH_TTL_SEC, '1');
  const base = cookieBase();
  res.cookie(ACCESS_COOKIE, access, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refresh, { ...base, maxAge: REFRESH_TTL_SEC * 1000 });
}

export function clearAuthCookies(res: Response): void {
  const base = cookieBase();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

async function publicUser(userId: string) {
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
      roles: { select: { role: true } },
    },
  });
  if (!profile) return null;
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
  };
}

export async function register(
  data: { email: string; password: string; firstName: string; lastName: string },
  res: Response
) {
  const existing = await prisma.profile.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error('El correo ya está registrado') as Error & { status: number };
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

export async function login(data: { email: string; password: string }, res: Response) {
  const user = await prisma.profile.findUnique({ where: { email: data.email } });
  if (!user) {
    const err = new Error('Credenciales inválidas') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  const ok = await bcrypt.compare(data.password, user.password);
  if (!ok) {
    const err = new Error('Credenciales inválidas') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  await setAuthCookies(res, user.id, user.email);
  const u = await publicUser(user.id);
  return { data: { user: u, isNewUser: false } };
}

export async function refreshTokens(refreshCookie: string | undefined, res: Response) {
  if (!refreshCookie) {
    const err = new Error('No autenticado') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(refreshCookie);
  } catch {
    const err = new Error('Token inválido') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  const key = refreshRedisKey(payload.sub, payload.jti);
  const exists = await redis.get(key);
  if (!exists) {
    const err = new Error('Sesión revocada') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  await redis.del(key);
  const profile = await prisma.profile.findUnique({ where: { id: payload.sub } });
  if (!profile) {
    const err = new Error('Usuario no encontrado') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  await setAuthCookies(res, profile.id, profile.email);
  const u = await publicUser(profile.id);
  return { data: { user: u } };
}

export async function logout(refreshCookie: string | undefined, res: Response) {
  if (refreshCookie) {
    try {
      const payload = verifyRefreshToken(refreshCookie);
      await redis.del(refreshRedisKey(payload.sub, payload.jti));
    } catch {
      /* ignore */
    }
  }
  clearAuthCookies(res);
  return { data: { ok: true } };
}

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export async function googleAuth(idToken: string, res: Response) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email) {
    const err = new Error('Token de Google inválido') as Error & { status: number };
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
