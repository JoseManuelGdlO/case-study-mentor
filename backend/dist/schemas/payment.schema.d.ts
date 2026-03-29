import { z } from 'zod';
export declare const checkoutTierSchema: z.ZodObject<{
    tier: z.ZodEnum<["monthly", "semester", "annual"]>;
}, "strip", z.ZodTypeAny, {
    tier: "monthly" | "semester" | "annual";
}, {
    tier: "monthly" | "semester" | "annual";
}>;
export declare const paypalCaptureSchema: z.ZodObject<{
    orderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    orderId: string;
}, {
    orderId: string;
}>;
//# sourceMappingURL=payment.schema.d.ts.map