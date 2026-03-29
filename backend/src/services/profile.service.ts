import { prisma } from '../config/database.js';

export async function getProfile(userId: string) {
  const p = await prisma.profile.findUnique({
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
  if (!p) {
    const err = new Error('Perfil no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  return {
    data: {
      id: p.id,
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName,
      university: p.university,
      graduationYear: p.graduationYear,
      examDate: p.examDate?.toISOString() ?? null,
      avatarUrl: p.avatarUrl,
      onboardingDone: p.onboardingDone,
      roles: p.roles.map((r) => r.role),
      plan: 'free' as const,
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
