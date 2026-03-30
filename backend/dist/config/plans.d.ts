export declare const PAID_TIERS: readonly ["monthly", "semester", "annual"];
export type PaidTier = (typeof PAID_TIERS)[number];
export declare function isPaidTier(t: string): t is PaidTier;
/** Valores por defecto (duración en días y etiquetas) cuando el backoffice no tiene aún filas; los montos reales vienen de `subscription_plans`. */
export declare const TIER_CHECKOUT: Record<PaidTier, {
    amountCents: number;
    durationDays: number;
    stripeProductName: string;
    paypalAmount: string;
}>;
//# sourceMappingURL=plans.d.ts.map