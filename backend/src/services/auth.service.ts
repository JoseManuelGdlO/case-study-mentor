import { randomBytes, randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import type { AuthProvider, SubscriptionTier } from '@prisma/client';
import type { Response } from 'express';
import { prisma } from '../config/database.js';
import { notifyAdminsNewPublicUser } from './admin-push.service.js';
import { env } from '../config/env.js';
import { redis } from '../config/redis.js';
import { isSmtpConfigured, sendGoogleAccountNoticeEmail, sendTemporaryPasswordEmail } from './email.service.js';
import { FREE_TRIAL_MAX_EXAMS } from '../constants/freeTrial.js';
import { effectivePlanFromProfile } from './profile.service.js';
import {
  REFRESH_TTL_SEC,
  impersonationFromPayload,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type ImpersonationClaims,
  type RefreshPayload,
} from '../utils/jwt.js';

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

export function sessionActiveKey(userId: string): string {
  return `session:active:${userId}`;
}

export async function setAuthCookies(
  res: Response,
  userId: string,
  email: string,
  impersonation?: ImpersonationClaims
): Promise<void> {
  const oldJti = await redis.get(sessionActiveKey(userId));
  if (oldJti) {
    await redis.del(refreshRedisKey(userId, oldJti));
  }
  const jti = randomUUID();
  const access = signAccessToken(userId, email, jti, impersonation);
  const { token: refresh } = signRefreshToken(userId, jti, impersonation);
  await redis.setex(refreshRedisKey(userId, jti), REFRESH_TTL_SEC, '1');
  await redis.setex(sessionActiveKey(userId), REFRESH_TTL_SEC, jti);
  const base = cookieBase();
  res.cookie(ACCESS_COOKIE, access, { ...base, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refresh, { ...base, maxAge: REFRESH_TTL_SEC * 1000 });
}

/** Target must exist and must not be admin/editor. */
export async function assertImpersonableTargetUser(targetUserId: string): Promise<ImpersonationClaims> {
  const p = await prisma.profile.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      email: true,
      roles: { select: { role: true } },
    },
  });
  if (!p) {
    const err = new Error('Usuario no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  const privileged = p.roles.some((r) => r.role === 'admin' || r.role === 'editor');
  if (privileged) {
    const err = new Error('No se puede ver como este usuario') as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return { userId: p.id, email: p.email };
}

export function clearAuthCookies(res: Response): void {
  const base = cookieBase();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

export async function publicUser(userId: string) {
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
      freeTrialExamsUsed: true,
      platformSuggestionPromptHandledAt: true,
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
  freeTrialExamsUsed: number;
  platformSuggestionPromptHandledAt: Date | null;
  roles: { role: string }[];
}) {
  const { plan, subscriptionExpiresAt } = effectivePlanFromProfile(profile);
  const freeTrialExamsRemaining =
    plan === 'free' ? Math.max(0, FREE_TRIAL_MAX_EXAMS - profile.freeTrialExamsUsed) : null;
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
    freeTrialExamsUsed: profile.freeTrialExamsUsed,
    freeTrialExamsRemaining,
    platformSuggestionPromptPending: profile.platformSuggestionPromptHandledAt == null,
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
  const displayName = `${user.firstName} ${user.lastName}`.trim();
  void notifyAdminsNewPublicUser({
    userId: user.id,
    email: user.email,
    displayName,
  }).catch((err) => console.warn('[admin-push] nuevo registro', err));
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
  let payload: RefreshPayload;
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
  let impersonation = impersonationFromPayload(payload);
  if (impersonation) {
    try {
      const ok = await assertImpersonableTargetUser(impersonation.userId);
      if (ok.email !== impersonation.email) impersonation = undefined;
      else impersonation = ok;
    } catch {
      impersonation = undefined;
    }
  }
  await setAuthCookies(res, profile.id, profile.email, impersonation);
  const effectiveId = impersonation?.userId ?? profile.id;
  const u = await publicUser(effectiveId);
  if (!u) {
    const err = new Error('Usuario no encontrado') as Error & { status: number };
    err.status = 401;
    throw err;
  }
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
      await redis.del(sessionActiveKey(payload.sub));
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
    const displayName = `${user.firstName} ${user.lastName}`.trim();
    void notifyAdminsNewPublicUser({
      userId: user.id,
      email: user.email,
      displayName,
    }).catch((err) => console.warn('[admin-push] nuevo registro Google', err));
  }
  await setAuthCookies(res, user.id, user.email);
  const u = await publicUser(user.id);
  return { data: { user: u, isNewUser } };
}
