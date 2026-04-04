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
export function isAdminPushConfigured() {
    return !!(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY && env.VAPID_SUBJECT);
}
export function getVapidPublicKey() {
    return env.VAPID_PUBLIC_KEY ?? null;
}
export async function subscribeAdminPush(userId, body) {
    const admin = await prisma.userRole.findFirst({ where: { userId, role: 'admin' } });
    if (!admin) {
        const e = new Error('Solo administradores pueden suscribirse a notificaciones push');
        e.status = 403;
        throw e;
    }
    const endpointHash = hashEndpoint(body.endpoint);
    await prisma.adminWebPushSubscription.upsert({
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
export async function unsubscribeAdminPush(userId, endpoint) {
    const endpointHash = hashEndpoint(endpoint);
    const row = await prisma.adminWebPushSubscription.findUnique({ where: { endpointHash } });
    if (!row || row.userId !== userId) {
        const e = new Error('Suscripción no encontrada');
        e.status = 404;
        throw e;
    }
    await prisma.adminWebPushSubscription.delete({ where: { endpointHash } });
}
export async function updateAdminPushPreferences(userId, prefs) {
    const admin = await prisma.userRole.findFirst({ where: { userId, role: 'admin' } });
    if (!admin) {
        const e = new Error('Solo administradores');
        e.status = 403;
        throw e;
    }
    return prisma.profile.update({
        where: { id: userId },
        data: {
            ...(prefs.notifyNewUser !== undefined ? { adminPushNotifyNewUser: prefs.notifyNewUser } : {}),
            ...(prefs.notifyNewSubscription !== undefined
                ? { adminPushNotifyNewSubscription: prefs.notifyNewSubscription }
                : {}),
        },
        select: { adminPushNotifyNewUser: true, adminPushNotifyNewSubscription: true },
    });
}
export async function getAdminPushPreferences(userId) {
    const admin = await prisma.userRole.findFirst({ where: { userId, role: 'admin' } });
    if (!admin) {
        const e = new Error('Solo administradores');
        e.status = 403;
        throw e;
    }
    return prisma.profile.findUnique({
        where: { id: userId },
        select: { adminPushNotifyNewUser: true, adminPushNotifyNewSubscription: true },
    });
}
async function sendToSubscription(sub, payload) {
    const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
        await webpush.sendNotification(pushSub, payload, { TTL: 86_400 });
    }
    catch (err) {
        const status = err?.statusCode;
        if (status === 410 || status === 404) {
            await prisma.adminWebPushSubscription.delete({ where: { id: sub.id } }).catch(() => { });
            return;
        }
        throw err;
    }
}
export async function notifyAdminsNewPublicUser(input) {
    if (!applyVapidIfConfigured())
        return;
    const admins = await prisma.profile.findMany({
        where: {
            adminPushNotifyNewUser: true,
            roles: { some: { role: 'admin' } },
        },
        select: {
            adminWebPushSubscriptions: {
                select: { id: true, endpoint: true, p256dh: true, auth: true },
            },
        },
    });
    const title = 'Nuevo registro';
    const body = `${input.displayName || input.email} se registró en ENARMX`;
    const payload = JSON.stringify({
        title,
        body,
        data: { type: 'new_user', userId: input.userId, url: '/backoffice/users' },
    });
    await Promise.allSettled(admins.flatMap((a) => a.adminWebPushSubscriptions.map((s) => sendToSubscription(s, payload).catch((e) => console.warn('[admin-push] Fallo envío', s.endpoint.slice(0, 64), e)))));
}
const tierLabels = {
    free: 'Gratis',
    monthly: 'Mensual',
    semester: 'Semestral',
    annual: 'Anual',
};
export async function notifyAdminsNewSubscription(input) {
    if (!applyVapidIfConfigured())
        return;
    if (input.tier === 'free')
        return;
    const admins = await prisma.profile.findMany({
        where: {
            adminPushNotifyNewSubscription: true,
            roles: { some: { role: 'admin' } },
        },
        select: {
            adminWebPushSubscriptions: {
                select: { id: true, endpoint: true, p256dh: true, auth: true },
            },
        },
    });
    const planLabel = tierLabels[input.tier] ?? input.tier;
    const title = 'Nueva suscripción';
    const body = `${input.displayName || input.email} — plan ${planLabel}`;
    const payload = JSON.stringify({
        title,
        body,
        data: { type: 'new_subscription', userId: input.userId, url: '/backoffice/users' },
    });
    await Promise.allSettled(admins.flatMap((a) => a.adminWebPushSubscriptions.map((s) => sendToSubscription(s, payload).catch((e) => console.warn('[admin-push] Fallo envío', s.endpoint.slice(0, 64), e)))));
}
//# sourceMappingURL=admin-push.service.js.map