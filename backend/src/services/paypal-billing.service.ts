import type { SubscriptionTier } from '@prisma/client';
import { prisma } from '../config/database.js';
import { requirePublicFrontendBaseUrlForPayments } from '../config/env.js';
import { isPaidTier, type PaidTier } from '../config/plans.js';
import { paypalFetch } from './paypal-api.js';
import { getActiveSubscriptionPlanForTier } from './subscription-plan.service.js';

function serviceError(message: string, status: number): Error & { status: number } {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
}

function parseCustomId(raw: string | undefined): { userId: string; tier: PaidTier } | null {
  if (!raw) return null;
  const idx = raw.indexOf(':');
  if (idx <= 0) return null;
  const userId = raw.slice(0, idx);
  const tier = raw.slice(idx + 1);
  if (!isPaidTier(tier)) return null;
  return { userId, tier };
}

/** Crea producto + plan en PayPal si la fila aún no tiene `paypalPlanId`, y lo activa. */
export async function ensurePayPalBillingPlan(planRow: {
  id: string;
  name: string;
  price: number;
  duration: number;
  paypalPlanId: string | null;
}): Promise<string> {
  if (planRow.paypalPlanId) return planRow.paypalPlanId;

  const priceStr = planRow.price.toFixed(2);

  const prodRes = await paypalFetch('/v1/catalogs/products', {
    method: 'POST',
    body: JSON.stringify({
      name: planRow.name,
      type: 'SERVICE',
      category: 'EDUCATION_AND_TRAINING',
    }),
  });
  if (!prodRes.ok) {
    const t = await prodRes.text();
    throw serviceError(`PayPal crear producto falló: ${t}`, 502);
  }
  const product = (await prodRes.json()) as { id: string };

  const planBody = {
    product_id: product.id,
    name: planRow.name,
    description: `Suscripción ${planRow.name}`,
    status: 'CREATED',
    billing_cycles: [
      {
        frequency: {
          interval_unit: 'DAY',
          interval_count: planRow.duration,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: priceStr,
            currency_code: 'MXN',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: '0', currency_code: 'MXN' },
      setup_fee_failure_action: 'CONTINUE',
      payment_failure_threshold: 3,
    },
  };

  const createPlanRes = await paypalFetch('/v1/billing/plans', {
    method: 'POST',
    body: JSON.stringify(planBody),
  });
  if (!createPlanRes.ok) {
    const t = await createPlanRes.text();
    throw serviceError(`PayPal crear plan de facturación falló: ${t}`, 502);
  }
  const billingPlan = (await createPlanRes.json()) as { id: string };

  const activateRes = await paypalFetch(`/v1/billing/plans/${encodeURIComponent(billingPlan.id)}/activate`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (!activateRes.ok) {
    const t = await activateRes.text();
    throw serviceError(`PayPal activar plan falló: ${t}`, 502);
  }

  await prisma.subscriptionPlan.update({
    where: { id: planRow.id },
    data: { paypalPlanId: billingPlan.id },
  });

  return billingPlan.id;
}

export type PayPalSubscriptionApi = {
  id: string;
  status?: string;
  custom_id?: string;
  billing_info?: { next_billing_time?: string };
};

export async function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscriptionApi> {
  const res = await paypalFetch(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    method: 'GET',
  });
  if (!res.ok) {
    const t = await res.text();
    throw serviceError(`PayPal suscripción no encontrada: ${t}`, 400);
  }
  return (await res.json()) as PayPalSubscriptionApi;
}

export async function syncProfileFromPayPalSubscriptionResource(sub: PayPalSubscriptionApi): Promise<void> {
  const parsed = parseCustomId(sub.custom_id);
  if (!parsed) {
    console.warn('[paypal] Suscripción sin custom_id válido', sub.id);
    return;
  }
  const next = sub.billing_info?.next_billing_time;
  let expiresAt: Date | null = next ? new Date(next) : null;
  if (!expiresAt) {
    const plan = await getActiveSubscriptionPlanForTier(parsed.tier);
    expiresAt = new Date(Date.now() + plan.duration * 86_400_000);
  }

  const status = (sub.status ?? '').toUpperCase();
  if (status === 'CANCELLED' || status === 'EXPIRED') {
    await prisma.profile.updateMany({
      where: { paypalSubscriptionId: sub.id },
      data: {
        paypalSubscriptionId: null,
        subscriptionCancelAtPeriodEnd: false,
        subscriptionTier: 'free',
        subscriptionExpiresAt: null,
      },
    });
    return;
  }

  if (status !== 'ACTIVE' && status !== 'APPROVAL_PENDING') {
    /* SUSPENDED etc.: mantener acceso según negocio; aquí solo actualizamos si hay fechas */
  }

  await prisma.profile.update({
    where: { id: parsed.userId },
    data: {
      paypalSubscriptionId: sub.id,
      subscriptionTier: parsed.tier as SubscriptionTier,
      subscriptionExpiresAt: expiresAt,
      subscriptionCancelAtPeriodEnd: false,
    },
  });
}

async function assertNoConflictingSubscription(userId: string): Promise<void> {
  const p = await prisma.profile.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true, paypalSubscriptionId: true },
  });
  if (!p) throw serviceError('Usuario no encontrado', 404);
  if (p.stripeSubscriptionId) {
    throw serviceError('Ya tienes una suscripción con Stripe. Cancélala antes de usar PayPal.', 409);
  }
  if (p.paypalSubscriptionId) {
    throw serviceError('Ya tienes una suscripción activa con PayPal.', 409);
  }
}

export async function createPayPalSubscriptionCheckout(
  userId: string,
  tier: PaidTier
): Promise<{ approvalUrl: string }> {
  await assertNoConflictingSubscription(userId);

  const planRow = await getActiveSubscriptionPlanForTier(tier);
  const planId = await ensurePayPalBillingPlan(planRow);

  const base = requirePublicFrontendBaseUrlForPayments();
  const customId = `${userId}:${tier}`;

  const body = {
    plan_id: planId,
    custom_id: customId,
    application_context: {
      brand_name: 'ENARM',
      locale: 'es-MX',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: `${base}/dashboard/subscription?paypal_sub_return=1`,
      cancel_url: `${base}/dashboard/subscription?canceled=paypal`,
    },
  };

  const res = await paypalFetch('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw serviceError(`PayPal crear suscripción falló: ${t}`, 502);
  }

  const created = (await res.json()) as {
    id: string;
    links?: { href: string; rel: string }[];
  };
  const approve = created.links?.find((l) => l.rel === 'approve')?.href;
  if (!approve) throw serviceError('PayPal no devolvió enlace de aprobación de suscripción', 502);
  return { approvalUrl: approve };
}

export async function confirmPayPalSubscriptionAfterApproval(
  userId: string,
  subscriptionId: string
): Promise<void> {
  let sub = await getPayPalSubscription(subscriptionId);
  const parsed = parseCustomId(sub.custom_id);
  if (!parsed || parsed.userId !== userId) {
    throw serviceError('La suscripción no corresponde al usuario autenticado', 403);
  }
  let st = (sub.status ?? '').toUpperCase();
  if (st === 'APPROVAL_PENDING') {
    await new Promise((r) => setTimeout(r, 1500));
    sub = await getPayPalSubscription(subscriptionId);
    st = (sub.status ?? '').toUpperCase();
  }
  if (st !== 'ACTIVE' && st !== 'APPROVAL_PENDING') {
    throw serviceError(`Estado de suscripción PayPal inesperado: ${sub.status}`, 400);
  }
  await syncProfileFromPayPalSubscriptionResource(sub);
}

export async function cancelPayPalSubscriptionForUser(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { paypalSubscriptionId: true },
  });
  if (!profile?.paypalSubscriptionId) {
    throw serviceError('No hay suscripción activa de PayPal', 400);
  }
  const sub = await getPayPalSubscription(profile.paypalSubscriptionId);
  const parsed = parseCustomId(sub.custom_id);
  if (parsed?.userId !== userId) {
    throw serviceError('La suscripción no corresponde a este usuario', 403);
  }

  const res = await paypalFetch(
    `/v1/billing/subscriptions/${encodeURIComponent(profile.paypalSubscriptionId)}/cancel`,
    {
      method: 'POST',
      body: JSON.stringify({ reason: 'User requested cancellation' }),
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw serviceError(`PayPal cancelar suscripción falló: ${t}`, 502);
  }

  await prisma.profile.update({
    where: { id: userId },
    data: { subscriptionCancelAtPeriodEnd: true },
  });
}
