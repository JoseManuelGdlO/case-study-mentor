import { z } from 'zod';
export declare const specialtyCreateSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const specialtyUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
}, {
    name?: string | undefined;
}>;
export declare const areaCreateSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const phraseCreateSchema: z.ZodObject<{
    text: z.ZodString;
    author: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    text: string;
    author: string;
    isActive?: boolean | undefined;
}, {
    text: string;
    author: string;
    isActive?: boolean | undefined;
}>;
export declare const phraseUpdateSchema: z.ZodObject<{
    text: z.ZodOptional<z.ZodString>;
    author: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    text?: string | undefined;
    isActive?: boolean | undefined;
    author?: string | undefined;
}, {
    text?: string | undefined;
    isActive?: boolean | undefined;
    author?: string | undefined;
}>;
export declare const flashcardCreateSchema: z.ZodObject<{
    question: z.ZodString;
    answer: z.ZodString;
    hint: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    specialtyIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    areaIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    question: string;
    answer: string;
    specialtyIds: string[];
    areaIds: string[];
    hint?: string | undefined;
    isActive?: boolean | undefined;
}, {
    question: string;
    answer: string;
    hint?: string | undefined;
    isActive?: boolean | undefined;
    specialtyIds?: string[] | undefined;
    areaIds?: string[] | undefined;
}>;
export declare const flashcardUpdateSchema: z.ZodObject<{
    question: z.ZodOptional<z.ZodString>;
    answer: z.ZodOptional<z.ZodString>;
    hint: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    specialtyIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    areaIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    question?: string | undefined;
    hint?: string | undefined;
    answer?: string | undefined;
    isActive?: boolean | undefined;
    specialtyIds?: string[] | undefined;
    areaIds?: string[] | undefined;
}, {
    question?: string | undefined;
    hint?: string | undefined;
    answer?: string | undefined;
    isActive?: boolean | undefined;
    specialtyIds?: string[] | undefined;
    areaIds?: string[] | undefined;
}>;
export declare const examDateCreateSchema: z.ZodObject<{
    name: z.ZodString;
    date: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    date: string;
    name: string;
    isActive?: boolean | undefined;
}, {
    date: string;
    name: string;
    isActive?: boolean | undefined;
}>;
export declare const examDateUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    date: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    date?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}, {
    date?: string | undefined;
    name?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const planCreateSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    duration: z.ZodNumber;
    features: z.ZodString;
    isActive: z.ZodOptional<z.ZodBoolean>;
    highlighted: z.ZodOptional<z.ZodBoolean>;
    /** monthly | semester | annual — recomendado para enlazar con el checkout. */
    tier: z.ZodOptional<z.ZodEnum<["monthly", "semester", "annual"]>>;
    /** Plan de facturación PayPal (P-...), opcional si se crea por API. */
    paypalPlanId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    duration: number;
    features: string;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}, {
    name: string;
    price: number;
    duration: number;
    features: string;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}>;
export declare const planUpdateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    price: z.ZodOptional<z.ZodNumber>;
    duration: z.ZodOptional<z.ZodNumber>;
    features: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    highlighted: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    tier: z.ZodOptional<z.ZodOptional<z.ZodEnum<["monthly", "semester", "annual"]>>>;
    paypalPlanId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    price?: number | undefined;
    duration?: number | undefined;
    features?: string | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}, {
    name?: string | undefined;
    tier?: "monthly" | "semester" | "annual" | undefined;
    isActive?: boolean | undefined;
    price?: number | undefined;
    duration?: number | undefined;
    features?: string | undefined;
    highlighted?: boolean | undefined;
    paypalPlanId?: string | undefined;
}>;
export declare const promotionCodeCreateSchema: z.ZodObject<{
    code: z.ZodString;
    percentOff: z.ZodNumber;
    maxRedemptions: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    validFrom: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    validUntil: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    percentOff: number;
    maxRedemptions?: number | null | undefined;
    validFrom?: string | null | undefined;
    validUntil?: string | null | undefined;
}, {
    code: string;
    percentOff: number;
    maxRedemptions?: number | null | undefined;
    validFrom?: string | null | undefined;
    validUntil?: string | null | undefined;
}>;
export declare const promotionCodePatchSchema: z.ZodObject<{
    isActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
}, {
    isActive: boolean;
}>;
/** Edición completa (mismos campos que crear + activo opcional). */
export declare const promotionCodePutSchema: z.ZodObject<{
    code: z.ZodString;
    percentOff: z.ZodNumber;
    maxRedemptions: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    validFrom: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    validUntil: z.ZodNullable<z.ZodOptional<z.ZodString>>;
} & {
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    percentOff: number;
    isActive?: boolean | undefined;
    maxRedemptions?: number | null | undefined;
    validFrom?: string | null | undefined;
    validUntil?: string | null | undefined;
}, {
    code: string;
    percentOff: number;
    isActive?: boolean | undefined;
    maxRedemptions?: number | null | undefined;
    validFrom?: string | null | undefined;
    validUntil?: string | null | undefined;
}>;
export declare const userRoleUpdateSchema: z.ZodObject<{
    roles: z.ZodArray<z.ZodEnum<["admin", "editor", "user"]>, "many">;
}, "strip", z.ZodTypeAny, {
    roles: ("admin" | "editor" | "user")[];
}, {
    roles: ("admin" | "editor" | "user")[];
}>;
/** Admin: actualizar correo y/o rol(es). Al menos uno de los dos. */
export declare const backofficeUserUpdateSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    roles: z.ZodOptional<z.ZodArray<z.ZodEnum<["admin", "editor", "user"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}>, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}, {
    email?: string | undefined;
    roles?: ("admin" | "editor" | "user")[] | undefined;
}>;
export declare const backofficeUserCreateSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    roles: z.ZodArray<z.ZodEnum<["admin", "editor", "user"]>, "many">;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles: ("admin" | "editor" | "user")[];
}, {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles: ("admin" | "editor" | "user")[];
}>;
export declare const backofficeImpersonateSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const backofficeUsersQuerySchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "editor", "user"]>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    role?: "admin" | "editor" | "user" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}, {
    search?: string | undefined;
    role?: "admin" | "editor" | "user" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const examReviewsQuerySchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit?: number | undefined;
    page?: number | undefined;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const examReviewSubmitSchema: z.ZodObject<{
    rating: z.ZodNumber;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    comment?: string | undefined;
}, {
    rating: number;
    comment?: string | undefined;
}>;
export declare const adminPushSubscribeSchema: z.ZodObject<{
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
export declare const adminPushUnsubscribeSchema: z.ZodObject<{
    endpoint: z.ZodString;
}, "strip", z.ZodTypeAny, {
    endpoint: string;
}, {
    endpoint: string;
}>;
export declare const adminPushPreferencesSchema: z.ZodEffects<z.ZodObject<{
    notifyNewUser: z.ZodOptional<z.ZodBoolean>;
    notifyNewSubscription: z.ZodOptional<z.ZodBoolean>;
    emailNotifyNewUser: z.ZodOptional<z.ZodBoolean>;
    emailNotifyNewSubscription: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    notifyNewUser?: boolean | undefined;
    notifyNewSubscription?: boolean | undefined;
    emailNotifyNewUser?: boolean | undefined;
    emailNotifyNewSubscription?: boolean | undefined;
}, {
    notifyNewUser?: boolean | undefined;
    notifyNewSubscription?: boolean | undefined;
    emailNotifyNewUser?: boolean | undefined;
    emailNotifyNewSubscription?: boolean | undefined;
}>, {
    notifyNewUser?: boolean | undefined;
    notifyNewSubscription?: boolean | undefined;
    emailNotifyNewUser?: boolean | undefined;
    emailNotifyNewSubscription?: boolean | undefined;
}, {
    notifyNewUser?: boolean | undefined;
    notifyNewSubscription?: boolean | undefined;
    emailNotifyNewUser?: boolean | undefined;
    emailNotifyNewSubscription?: boolean | undefined;
}>;
//# sourceMappingURL=backoffice.schema.d.ts.map