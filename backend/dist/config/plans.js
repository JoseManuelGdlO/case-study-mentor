export const PAID_TIERS = ['monthly', 'semester', 'annual'];
export function isPaidTier(t) {
    return PAID_TIERS.includes(t);
}
/** Valores por defecto (duración en días y etiquetas) cuando el backoffice no tiene aún filas; los montos reales vienen de `subscription_plans`. */
export const TIER_CHECKOUT = {
    monthly: {
        amountCents: 200 * 100,
        durationDays: 30,
        stripeProductName: 'Plan mensual ENARM',
        paypalAmount: '200.00',
    },
    semester: {
        amountCents: 1000 * 100,
        durationDays: 180,
        stripeProductName: 'Plan semestral ENARM',
        paypalAmount: '1000.00',
    },
    annual: {
        amountCents: 2100 * 100,
        durationDays: 365,
        stripeProductName: 'Plan anual ENARM',
        paypalAmount: '2100.00',
    },
};
//# sourceMappingURL=plans.js.map