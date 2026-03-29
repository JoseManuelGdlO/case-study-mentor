export const PAID_TIERS = ['monthly', 'semester', 'annual'] as const;
export type PaidTier = (typeof PAID_TIERS)[number];

export function isPaidTier(t: string): t is PaidTier {
  return (PAID_TIERS as readonly string[]).includes(t);
}

/** Precios alineados con el frontend (MXN); amount en centavos para Stripe. */
export const TIER_CHECKOUT: Record<
  PaidTier,
  { amountCents: number; durationDays: number; stripeProductName: string; paypalAmount: string }
> = {
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
