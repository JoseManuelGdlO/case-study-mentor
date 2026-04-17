import { createHash } from 'crypto';
import webpush from 'web-push';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
function hashEndpoint(endpoint) {
    return createHash('sha256').update(endpoint, 'utf8').digest('hex');
}
let vapidApplied = false;
function applyVapidIfConfigured() {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT)
        return false;
    if (!vapidApplied) {
        webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        vapidApplied = true;
    }
    return true;
}
export function isUserPushConfigured() {
    return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}
export function getUserVapidPublicKey() {
    return env.VAPID_PUBLIC_KEY ?? null;
}
export async function subscribeUserPush(userId, body) {
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
export async function unsubscribeUserPush(userId, endpoint) {
    const endpointHash = hashEndpoint(endpoint);
    const row = await prisma.userWebPushSubscription.findUnique({ where: { endpointHash } });
    if (!row || row.userId !== userId) {
        const e = new Error('Suscripción no encontrada');
        e.status = 404;
        throw e;
    }
    await prisma.userWebPushSubscription.delete({ where: { endpointHash } });
}
export async function updateUserWellbeingNotificationPreferences(userId, prefs) {
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
export async function getUserWellbeingNotificationPreferences(userId) {
    return prisma.profile.findUnique({
        where: { id: userId },
        select: {
            wellbeingPushEnabled: true,
            wellbeingReminderTime: true,
            wellbeingReminderDays: true,
        },
    });
}
export async function notifyUserWellbeingReminder(input) {
    if (!applyVapidIfConfigured())
        return;
    const user = await prisma.profile.findUnique({
        where: { id: input.userId },
        select: {
            wellbeingPushEnabled: true,
            userWebPushSubscriptions: {
                select: { id: true, endpoint: true, p256dh: true, auth: true },
            },
        },
    });
    if (!user?.wellbeingPushEnabled || user.userWebPushSubscriptions.length === 0)
        return;
    const payload = JSON.stringify({
        title: input.title,
        body: input.body,
        data: { type: 'wellbeing_reminder', url: input.url ?? '/dashboard/wellbeing' },
    });
    await Promise.allSettled(user.userWebPushSubscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
            }, payload, { TTL: 86_400 });
        }
        catch (err) {
            const status = err?.statusCode;
            if (status === 410 || status === 404) {
                await prisma.userWebPushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
            }
        }
    }));
}
//# sourceMappingURL=user-push.service.js.map