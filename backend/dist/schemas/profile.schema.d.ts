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
//# sourceMappingURL=profile.schema.d.ts.map