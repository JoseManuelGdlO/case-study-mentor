import { randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import type { AuthProvider, SubscriptionTier } from '@prisma/client';
import type { Response } from 'express';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { isSmtpConfigured, sendGoogleAccountNoticeEmail, sendTemporaryPasswordEmail } from './email.service.js';
import { effectivePlanFromProfile } from './profile.service.js';
import { REFRESH_TTL_SEC, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const BCRYPT_ROUNDS = 12;

const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'Si ese correo está registrado, recibirás un mensaje con instrucciones en los próximos minutos.';
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
      authProvider: true,
      firstName: true,
      lastName: true,
      university: true,
      graduationYear: true,
      examDate: true,
      avatarUrl: true,
      onboardingDone: true,
      subscriptionTier: true,
      subscriptionExpiresAt: true,
      stripeSubscriptionId: true,
      paypalSubscriptionId: true,
      subscriptionCancelAtPeriodEnd: true,
      roles: { select: { role: true } },
    },
  });
  if (!profile) return null;
  return buildPublicUser(profile);
}

function buildPublicUser(profile: {
  id: string;
  email: string;
  authProvider: AuthProvider;
  firstName: string;
  lastName: string;
  university: string | null;
  graduationYear: number | null;
  examDate: Date | null;
  avatarUrl: string | null;
  onboardingDone: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | null;
  stripeSubscriptionId: string | null;
  paypalSubscriptionId: string | null;
  subscriptionCancelAtPeriodEnd: boolean;
  roles: { role: string }[];
}) {
  const { plan, subscriptionExpiresAt } = effectivePlanFromProfile(profile);
  return {
    id: profile.id,
    email: profile.email,
    authProvider: profile.authProvider,
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
    hasStripeSubscription: !!profile.stripeSubscriptionId,
    hasPayPalSubscription: !!profile.paypalSubscriptionId,
    subscriptionCancelAtPeriodEnd: profile.subscriptionCancelAtPeriodEnd,
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
      authProvider: 'email',
      firstName: data.firstName,
      lastName: data.lastName,
      roles: { create: { role: 'user' } },
    },
  });
  await setAuthCookies(res, user.id, user.email);
  const u = await publicUser(user.id);
  return { data: { user: u, isNewUser: true } };
}

/** Crea cuenta con email/contraseña y roles arbitrarios (solo invocado desde backoffice admin). */
export async function createUserByAdmin(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roles: ('admin' | 'editor' | 'user')[];
}) {
  const email = data.email.trim();
  const existing = await prisma.profile.findUnique({ where: { email } });
  if (existing) {
    const err = new Error('El correo ya está registrado') as Error & { status: number };
    err.status = 409;
    throw err;
  }
  const hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
  const roleSet = [...new Set(data.roles)];
  const onboardingDone = roleSet.some((r) => r === 'admin' || r === 'editor');
  const user = await prisma.profile.create({
    data: {
      email,
      password: hash,
      authProvider: 'email',
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      onboardingDone,
      roles: { createMany: { data: roleSet.map((role) => ({ role })) } },
    },
  });
  const u = await publicUser(user.id);
  if (!u) {
    const err = new Error('No se pudo crear el usuario') as Error & { status: number };
    err.status = 500;
    throw err;
  }
  return { data: { user: u } };
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

export async function requestPasswordReset(email: string) {
  if (env.NODE_ENV === 'production' && !isSmtpConfigured()) {
    const err = new Error('Servicio de correo no disponible') as Error & { status: number };
    err.status = 503;
    throw err;
  }

  const trimmed = email.trim();
  const user = await prisma.profile.findUnique({ where: { email: trimmed } });

  if (!user) {
    return { data: { message: FORGOT_PASSWORD_GENERIC_MESSAGE } };
  }

  if (user.authProvider === 'google') {
    await sendGoogleAccountNoticeEmail(user.email);
    return { data: { message: FORGOT_PASSWORD_GENERIC_MESSAGE } };
  }

  const plain = randomBytes(18).toString('base64url');
  const hash = await bcrypt.hash(plain, BCRYPT_ROUNDS);
  await prisma.profile.update({
    where: { id: user.id },
    data: { password: hash },
  });
  await sendTemporaryPasswordEmail(user.email, plain);
  return { data: { message: FORGOT_PASSWORD_GENERIC_MESSAGE } };
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
        authProvider: 'google',
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
