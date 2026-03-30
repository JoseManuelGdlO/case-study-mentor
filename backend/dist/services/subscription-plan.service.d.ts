import { type PaidTier } from '../config/plans.js';
/**
 * Plan de precios del backoffice (`subscription_plans`) para un tier de pago.
 * Prioridad: fila con `tier` coincidente y activa; si no, fila activa con `duration` igual al esperado del tier.
 */
export declare function getActiveSubscriptionPlanForTier(tier: PaidTier): Promise<{
    name: string;
    id: string;
    tier: import("@prisma/client").$Enums.SubscriptionTier | null;
    isActive: boolean;
    price: number;
    duration: number;
    features: string;
    highlighted: boolean;
    paypalPlanId: string | null;
}>;
export declare function subscriptionPlanPriceCents(plan: {
    price: number;
}): number;
//# sourceMappingURL=subscription-plan.service.d.ts.map