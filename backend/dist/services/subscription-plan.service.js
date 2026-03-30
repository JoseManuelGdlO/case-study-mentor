import { prisma } from '../config/database.js';
import { TIER_CHECKOUT } from '../config/plans.js';
function serviceError(message, status) {
    const e = new Error(message);
    e.status = status;
    return e;
}
/**
 * Plan de precios del backoffice (`subscription_plans`) para un tier de pago.
 * Prioridad: fila con `tier` coincidente y activa; si no, fila activa con `duration` igual al esperado del tier.
 */
export async function getActiveSubscriptionPlanForTier(tier) {
    const expectedDays = TIER_CHECKOUT[tier].durationDays;
    const byTier = await prisma.subscriptionPlan.findFirst({
        where: { tier: tier, isActive: true },
        orderBy: { price: 'asc' },
    });
    if (byTier)
        return byTier;
    const byDuration = await prisma.subscriptionPlan.findFirst({
        where: { duration: expectedDays, isActive: true },
        orderBy: { price: 'asc' },
    });
    if (byDuration)
        return byDuration;
    throw serviceError(`No hay plan de precios activo en el backoffice para «${tier}». ` +
        `Crea un plan con tier «${tier}» o con duración ${expectedDays} días.`, 503);
}
export function subscriptionPlanPriceCents(plan) {
    return Math.round(plan.price * 100);
}
//# sourceMappingURL=subscription-plan.service.js.map