export declare const PAID_TIERS: readonly ["monthly", "semester", "annual"];
export type PaidTier = (typeof PAID_TIERS)[number];
export declare function isPaidTier(t: string): t is PaidTier;
/** Precios alineados con el frontend (MXN); amount en centavos para Stripe. */
export declare const TIER_CHECKOUT: Record<PaidTier, {
    amountCents: number;
    durationDays: number;
    stripeProductName: string;
    paypalAmount: string;
}>;
//# sourceMappingURL=plans.d.ts.map