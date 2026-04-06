import { z } from 'zod';
export declare const checkoutTierSchema: z.ZodObject<{
    tier: z.ZodEnum<["monthly", "semester", "annual"]>;
}, "strip", z.ZodTypeAny, {
    tier: "monthly" | "semester" | "annual";
}, {
    tier: "monthly" | "semester" | "annual";
}>;
export declare const subscriptionCheckoutSchema: z.ZodObject<{
    tier: z.ZodEnum<["monthly", "semester", "annual"]>;
} & {
    promotionCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    tier: "monthly" | "semester" | "annual";
    promotionCode?: string | undefined;
}, {
    tier: "monthly" | "semester" | "annual";
    promotionCode?: string | undefined;
}>;
export declare const validatePromotionCodeBodySchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const paypalCaptureSchema: z.ZodObject<{
    orderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orderId: string;
}, {
    orderId: string;
}>;
export declare const paypalSubscriptionConfirmSchema: z.ZodObject<{
    subscriptionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    subscriptionId: string;
}, {
    subscriptionId: string;
}>;
export declare const subscriptionCancelFeedbackSchema: z.ZodObject<{
    reason: z.ZodEnum<["too_expensive", "not_using_enough", "exam_finished_or_paused", "found_alternative", "technical_issues", "content_not_expected", "prefer_not_to_say", "other"]>;
    details: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason: "other" | "too_expensive" | "not_using_enough" | "exam_finished_or_paused" | "found_alternative" | "technical_issues" | "content_not_expected" | "prefer_not_to_say";
    details?: string | null | undefined;
}, {
    reason: "other" | "too_expensive" | "not_using_enough" | "exam_finished_or_paused" | "found_alternative" | "technical_issues" | "content_not_expected" | "prefer_not_to_say";
    details?: string | null | undefined;
}>;
//# sourceMappingURL=payment.schema.d.ts.map