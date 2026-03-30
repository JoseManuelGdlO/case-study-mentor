import type { SubscriptionTier } from '@prisma/client';
import { prisma } from '../config/database.js';
import { TIER_CHECKOUT, type PaidTier } from '../config/plans.js';

function serviceError(message: string, status: number): Error & { status: number } {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
}

/**
 * Plan de precios del backoffice (`subscription_plans`) para un tier de pago.
 * Prioridad: fila con `tier` coincidente y activa; si no, fila activa con `duration` igual al esperado del tier.
 */
export async function getActiveSubscriptionPlanForTier(tier: PaidTier) {
  const expectedDays = TIER_CHECKOUT[tier].durationDays;

  const byTier = await prisma.subscriptionPlan.findFirst({
    where: { tier: tier as SubscriptionTier, isActive: true },
    orderBy: { price: 'asc' },
  });
  if (byTier) return byTier;

  const byDuration = await prisma.subscriptionPlan.findFirst({
    where: { duration: expectedDays, isActive: true },
    orderBy: { price: 'asc' },
  });
  if (byDuration) return byDuration;

  throw serviceError(
    `No hay plan de precios activo en el backoffice para «${tier}». ` +
      `Crea un plan con tier «${tier}» o con duración ${expectedDays} días.`,
    503
  );
}

export function subscriptionPlanPriceCents(plan: { price: number }): number {
  return Math.round(plan.price * 100);
}
