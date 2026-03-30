import type { SubscriptionTier } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';

const BCRYPT_ROUNDS = 12;

export type ApiUserPlan = 'free' | 'monthly' | 'semester' | 'annual';

export function effectivePlanFromProfile(row: {
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt: Date | null;
}): { plan: ApiUserPlan; subscriptionExpiresAt: string | null } {
  const now = new Date();
  const tier = row.subscriptionTier;
  const exp = row.subscriptionExpiresAt;
  if (
    tier !== 'free' &&
    (tier === 'monthly' || tier === 'semester' || tier === 'annual') &&
    exp &&
    exp > now
  ) {
    return { plan: tier, subscriptionExpiresAt: exp.toISOString() };
  }
  return { plan: 'free', subscriptionExpiresAt: null };
}

export async function getProfile(userId: string) {
  const p = await prisma.profile.findUnique({
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
  if (!p) {
    const err = new Error('Perfil no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  const { plan, subscriptionExpiresAt } = effectivePlanFromProfile(p);
  return {
    data: {
      id: p.id,
      email: p.email,
      authProvider: p.authProvider,
      firstName: p.firstName,
      lastName: p.lastName,
      university: p.university,
      graduationYear: p.graduationYear,
      examDate: p.examDate?.toISOString() ?? null,
      avatarUrl: p.avatarUrl,
      onboardingDone: p.onboardingDone,
      roles: p.roles.map((r) => r.role),
      plan,
      subscriptionExpiresAt,
      hasStripeSubscription: !!p.stripeSubscriptionId,
      hasPayPalSubscription: !!p.paypalSubscriptionId,
      subscriptionCancelAtPeriodEnd: p.subscriptionCancelAtPeriodEnd,
    },
  };
}

export async function updateProfile(
  userId: string,
  body: {
    firstName?: string;
    lastName?: string;
    university?: string | null;
    graduationYear?: number | null;
    examDate?: string | null;
    avatarUrl?: string | null;
  }
) {
  await prisma.profile.update({
    where: { id: userId },
    data: {
      ...(body.firstName != null ? { firstName: body.firstName } : {}),
      ...(body.lastName != null ? { lastName: body.lastName } : {}),
      ...(body.university !== undefined ? { university: body.university } : {}),
      ...(body.graduationYear !== undefined ? { graduationYear: body.graduationYear } : {}),
      ...(body.examDate !== undefined
        ? { examDate: body.examDate ? new Date(body.examDate) : null }
        : {}),
      ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
    },
  });
  return getProfile(userId);
}

export async function completeOnboarding(userId: string) {
  await prisma.profile.update({
    where: { id: userId },
    data: { onboardingDone: true },
  });
  return getProfile(userId);
}

export async function changePassword(
  userId: string,
  body: { currentPassword: string; newPassword: string }
) {
  const user = await prisma.profile.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error('Perfil no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  if (user.authProvider === 'google') {
    const err = new Error(
      'Las cuentas que usan Google no pueden cambiar la contraseña desde aquí'
    ) as Error & { status: number };
    err.status = 403;
    throw err;
  }
  const ok = await bcrypt.compare(body.currentPassword, user.password);
  if (!ok) {
    const err = new Error('La contraseña actual no es correcta') as Error & { status: number };
    err.status = 401;
    throw err;
  }
  const hash = await bcrypt.hash(body.newPassword, BCRYPT_ROUNDS);
  await prisma.profile.update({
    where: { id: userId },
    data: { password: hash },
  });
  return { data: { ok: true } };
}
