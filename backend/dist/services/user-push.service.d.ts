export declare function isUserPushConfigured(): boolean;
export declare function getUserVapidPublicKey(): string | null;
export declare function subscribeUserPush(userId: string, body: {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}): Promise<void>;
export declare function unsubscribeUserPush(userId: string, endpoint: string): Promise<void>;
export declare function updateUserWellbeingNotificationPreferences(userId: string, prefs: {
    wellbeingPushEnabled?: boolean;
    wellbeingReminderTime?: string | null;
    wellbeingReminderDays?: string[] | null;
}): Promise<{
    wellbeingPushEnabled: boolean;
    wellbeingReminderTime: string | null;
    wellbeingReminderDays: string | null;
}>;
export declare function getUserWellbeingNotificationPreferences(userId: string): Promise<{
    wellbeingPushEnabled: boolean;
    wellbeingReminderTime: string | null;
    wellbeingReminderDays: string | null;
} | null>;
export declare function notifyUserWellbeingReminder(input: {
    userId: string;
    title: string;
    body: string;
    url?: string;
}): Promise<void>;
//# sourceMappingURL=user-push.service.d.ts.map