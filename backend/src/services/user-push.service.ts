import { createHash } from 'crypto';
import webpush from 'web-push';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

function hashEndpoint(endpoint: string): string {
  return createHash('sha256').update(endpoint, 'utf8').digest('hex');
}

let vapidApplied = false;

function applyVapidIfConfigured(): boolean {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return false;
  if (!vapidApplied) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidApplied = true;
  }
  return true;
}

export function isUserPushConfigured(): boolean {
  return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}

export function getUserVapidPublicKey(): string | null {
  return env.VAPID_PUBLIC_KEY ?? null;
}

export async function subscribeUserPush(
  userId: string,
  body: { endpoint: string; keys: { p256dh: string; auth: string } }
): Promise<void> {
  const endpointHash = hashEndpoint(body.endpoint);
  await prisma.userWebPushSubscription.upsert({
    where: { endpointHash },
    create: {
      userId,
      endpoint: body.endpoint,
      endpointHash,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
    update: {
      userId,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
  });
}

export async function unsubscribeUserPush(userId: string, endpoint: string): Promise<void> {
  const endpointHash = hashEndpoint(endpoint);
  const row = await prisma.userWebPushSubscription.findUnique({ where: { endpointHash } });
  if (!row || row.userId !== userId) {
    const e = new Error('Suscripción no encontrada') as Error & { status: number };
    e.status = 404;
    throw e;
  }
  await prisma.userWebPushSubscription.delete({ where: { endpointHash } });
}

export async function updateUserWellbeingNotificationPreferences(
  userId: string,
  prefs: {
    wellbeingPushEnabled?: boolean;
    wellbeingReminderTime?: string | null;
    wellbeingReminderDays?: string[] | null;
  }
) {
  return prisma.profile.update({
    where: { id: userId },
    data: {
      ...(prefs.wellbeingPushEnabled !== undefined
        ? { wellbeingPushEnabled: prefs.wellbeingPushEnabled }
        : {}),
      ...(prefs.wellbeingReminderTime !== undefined
        ? { wellbeingReminderTime: prefs.wellbeingReminderTime }
        : {}),
      ...(prefs.wellbeingReminderDays !== undefined
        ? { wellbeingReminderDays: prefs.wellbeingReminderDays?.join(',') ?? null }
        : {}),
    },
    select: {
      wellbeingPushEnabled: true,
      wellbeingReminderTime: true,
      wellbeingReminderDays: true,
    },
  });
}

export async function getUserWellbeingNotificationPreferences(userId: string) {
  return prisma.profile.findUnique({
    where: { id: userId },
    select: {
      wellbeingPushEnabled: true,
      wellbeingReminderTime: true,
      wellbeingReminderDays: true,
    },
  });
}

export async function notifyUserWellbeingReminder(input: {
  userId: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  if (!applyVapidIfConfigured()) return;
  const user = await prisma.profile.findUnique({
    where: { id: input.userId },
    select: {
      wellbeingPushEnabled: true,
      userWebPushSubscriptions: {
        select: { id: true, endpoint: true, p256dh: true, auth: true },
      },
    },
  });
  if (!user?.wellbeingPushEnabled || user.userWebPushSubscriptions.length === 0) return;
  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    data: { type: 'wellbeing_reminder', url: input.url ?? '/dashboard/wellbeing' },
  });
  await Promise.allSettled(
    user.userWebPushSubscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
          { TTL: 86_400 }
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 410 || status === 404) {
          await prisma.userWebPushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );
}
