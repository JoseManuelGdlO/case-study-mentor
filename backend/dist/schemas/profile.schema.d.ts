import { z } from 'zod';
export declare const profileUpdateSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    university: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    graduationYear: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    examDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    avatarUrl: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    university?: string | null | undefined;
    graduationYear?: number | null | undefined;
    examDate?: string | null | undefined;
    avatarUrl?: string | null | undefined;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    university?: string | null | undefined;
    graduationYear?: number | null | undefined;
    examDate?: string | null | undefined;
    avatarUrl?: string | null | undefined;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    newPasswordConfirm: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}, {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}>, {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}, {
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}>;
export declare const wellbeingPushSubscribeSchema: z.ZodObject<{
    endpoint: z.ZodString;
    keys: z.ZodObject<{
        p256dh: z.ZodString;
        auth: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        p256dh: string;
        auth: string;
    }, {
        p256dh: string;
        auth: string;
    }>;
}, "strip", z.ZodTypeAny, {
    keys: {
        p256dh: string;
        auth: string;
    };
    endpoint: string;
}, {
    keys: {
        p256dh: string;
        auth: string;
    };
    endpoint: string;
}>;
export declare const wellbeingPushUnsubscribeSchema: z.ZodObject<{
    endpoint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    endpoint: string;
}, {
    endpoint: string;
}>;
export declare const wellbeingNotificationPreferencesSchema: z.ZodObject<{
    wellbeingPushEnabled: z.ZodOptional<z.ZodBoolean>;
    wellbeingReminderTime: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    wellbeingReminderDays: z.ZodOptional<z.ZodArray<z.ZodEnum<["mon", "tue", "wed", "thu", "fri", "sat", "sun"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    wellbeingPushEnabled?: boolean | undefined;
    wellbeingReminderTime?: string | null | undefined;
    wellbeingReminderDays?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[] | undefined;
}, {
    wellbeingPushEnabled?: boolean | undefined;
    wellbeingReminderTime?: string | null | undefined;
    wellbeingReminderDays?: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[] | undefined;
}>;
//# sourceMappingURL=profile.schema.d.ts.map