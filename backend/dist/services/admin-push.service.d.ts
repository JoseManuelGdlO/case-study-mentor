import type { SubscriptionTier } from '@prisma/client';
export declare function isAdminPushConfigured(): boolean;
export declare function getVapidPublicKey(): string | null;
export declare function subscribeAdminPush(userId: string, body: {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}): Promise<void>;
export declare function unsubscribeAdminPush(userId: string, endpoint: string): Promise<void>;
export declare function updateAdminPushPreferences(userId: string, prefs: {
    notifyNewUser?: boolean;
    notifyNewSubscription?: boolean;
    emailNotifyNewUser?: boolean;
    emailNotifyNewSubscription?: boolean;
}): Promise<{
    adminPushNotifyNewUser: boolean;
    adminPushNotifyNewSubscription: boolean;
    adminEmailNotifyNewUser: boolean;
    adminEmailNotifyNewSubscription: boolean;
}>;
export declare function getAdminPushPreferences(userId: string): Promise<{
    adminPushNotifyNewUser: boolean;
    adminPushNotifyNewSubscription: boolean;
    adminEmailNotifyNewUser: boolean;
    adminEmailNotifyNewSubscription: boolean;
} | null>;
export declare function notifyAdminsNewPublicUser(input: {
    userId: string;
    email: string;
    displayName: string;
}): Promise<void>;
export declare function notifyAdminsNewSubscription(input: {
    userId: string;
    email: string;
    displayName: string;
    tier: SubscriptionTier;
}): Promise<void>;
//# sourceMappingURL=admin-push.service.d.ts.map