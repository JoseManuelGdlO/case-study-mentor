import Stripe from 'stripe';
import {
  PaymentProvider,
  PaymentStatus,
  type Prisma,
  type SubscriptionCancelReason,
  type SubscriptionTier,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { env, requirePublicFrontendBaseUrlForPayments } from '../config/env.js';
import { isPaidTier, type PaidTier } from '../config/plans.js';
import {
  getActiveSubscriptionPlanForTier,
  subscriptionPlanPriceCents,
} from './subscription-plan.service.js';
import {
  getPayPalSubscription,
  syncProfileFromPayPalSubscriptionResource,
} from './paypal-billing.service.js';
import { paypalAccessToken, paypalApiBase, paypalFetch } from './paypal-api.js';

function serviceError(message: string, status: number): Error & { status: number } {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
}

let stripeSdk: Stripe | null = null;

function getStripe(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw serviceError('Stripe no está configurado', 503);
  if (!stripeSdk) {
    stripeSdk = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeSdk;
}

function paypalValueToCents(value: string, currency: string): number {
  const n = parseFloat(value);
  if (currency.toUpperCase() === 'JPY' || currency.toUpperCase() === 'KRW') return Math.round(n);
  return Math.round(n * 100);
}

function parsePayPalCustomId(raw: string | undefined): { userId: string; tier: PaidTier } | null {
  if (!raw) return null;
  const idx = raw.indexOf(':');
  if (idx <= 0) return null;
  const userId = raw.slice(0, idx);
  const tier = raw.slice(idx + 1);
  if (!isPaidTier(tier)) return null;
  return { userId, tier };
}

export async function applyCompletedPayment(input: {
  userId: string;
  provider: PaymentProvider;
  externalId: string;
  amountCents: number;
  currency: string;
  tier: PaidTier;
  stripeCustomerId?: string | null;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  const plan = await getActiveSubscriptionPlanForTier(input.tier);
  const expectedCents = subscriptionPlanPriceCents(plan);
  if (input.amountCents !== expectedCents) {
    throw serviceError('El monto del pago no coincide con el plan del backoffice', 400);
  }
  if (input.currency.toLowerCase() !== 'mxn') {
    throw serviceError('Moneda no soportada', 400);
  }

  await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: {
        provider_externalId: { provider: input.provider, externalId: input.externalId },
      },
    });
    if (existing?.status === PaymentStatus.completed) return;

    if (existing && existing.userId !== input.userId) {
      throw serviceError('Conflicto de identidad en el pago', 400);
    }

    if (existing) {
      await tx.payment.update({
        where: { id: existing.id },
        data: {
          status: PaymentStatus.completed,
          amount: input.amountCents,
          currency: input.currency.toLowerCase(),
          tier: input.tier as SubscriptionTier,
          metadata: input.metadata ?? undefined,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          userId: input.userId,
          provider: input.provider,
          externalId: input.externalId,
          amount: input.amountCents,
          currency: input.currency.toLowerCase(),
          status: PaymentStatus.completed,
          tier: input.tier as SubscriptionTier,
          metadata: input.metadata ?? undefined,
        },
      });
    }

    const profile = await tx.profile.findUnique({ where: { id: input.userId } });
    if (!profile) throw serviceError('Usuario no encontrado', 404);

    const now = new Date();
    const base =
      profile.subscriptionExpiresAt && profile.subscriptionExpiresAt > now
        ? profile.subscriptionExpiresAt
        : now;
    const newExpires = new Date(base.getTime() + plan.duration * 86_400_000);

    await tx.profile.update({
      where: { id: input.userId },
      data: {
        subscriptionTier: input.tier as SubscriptionTier,
        subscriptionExpiresAt: newExpires,
        ...(input.stripeCustomerId ? { stripeCustomerId: input.stripeCustomerId } : {}),
      },
    });
  });
}

export async function createStripeCheckoutSession(userId: string, tier: PaidTier): Promise<{ url: string }> {
  const stripe = getStripe();
  const plan = await getActiveSubscriptionPlanForTier(tier);
  const base = requirePublicFrontendBaseUrlForPayments();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: { name: plan.name },
          unit_amount: subscriptionPlanPriceCents(plan),
        },
        quantity: 1,
      },
    ],
    success_url: `${base}/dashboard/subscription?paid=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard/subscription?canceled=stripe`,
    client_reference_id: userId,
    metadata: { userId, tier },
  });

  if (!session.url) throw serviceError('Stripe no devolvió URL de checkout', 502);
  return { url: session.url };
}

export async function createStripeSubscriptionCheckoutSession(
  userId: string,
  tier: PaidTier
): Promise<{ url: string }> {
  const stripe = getStripe();
  const plan = await getActiveSubscriptionPlanForTier(tier);
  const base = requirePublicFrontendBaseUrlForPayments();

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true, paypalSubscriptionId: true },
  });
  if (!profile) throw serviceError('Usuario no encontrado', 404);
  if (profile.paypalSubscriptionId) {
    throw serviceError('Ya tienes una suscripción con PayPal. Cancélala antes de usar Stripe.', 409);
  }

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: { name: plan.name },
          unit_amount: subscriptionPlanPriceCents(plan),
          recurring: {
            interval: 'day',
            interval_count: plan.duration,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${base}/dashboard/subscription?paid=stripe&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard/subscription?canceled=stripe`,
    client_reference_id: userId,
    metadata: { userId, tier },
    subscription_data: {
      metadata: { userId, tier },
    },
  };

  if (profile.stripeCustomerId) {
    sessionParams.customer = profile.stripeCustomerId;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  if (!session.url) throw serviceError('Stripe no devolvió URL de checkout', 502);
  return { url: session.url };
}

async function resolveUserIdForStripeSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const metaUid = sub.metadata?.userId;
  if (metaUid) return metaUid;
  const profile = await prisma.profile.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { id: true },
  });
  return profile?.id ?? null;
}

function tierFromStripeSubscription(sub: Stripe.Subscription): PaidTier | null {
  const t = sub.metadata?.tier;
  if (t && isPaidTier(t)) return t;
  return null;
}

async function syncStripeSubscriptionToProfile(sub: Stripe.Subscription): Promise<void> {
  const userId = await resolveUserIdForStripeSubscription(sub);
  if (!userId) {
    console.warn('[payments] Stripe subscription sin userId resoluble', sub.id);
    return;
  }
  const tier = tierFromStripeSubscription(sub);
  if (!tier) {
    console.warn('[payments] No se pudo resolver tier de suscripción', sub.id);
    return;
  }

  const customerId =
    typeof sub.customer === 'string' ? sub.customer : (sub.customer as Stripe.Customer | null)?.id ?? null;
  const periodEnd = sub.current_period_end;
  if (!periodEnd) return;

  const expiresAt = new Date(periodEnd * 1000);

  await prisma.profile.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: sub.id,
      ...(customerId ? { stripeCustomerId: customerId } : {}),
      subscriptionTier: tier as SubscriptionTier,
      subscriptionExpiresAt: expiresAt,
      subscriptionCancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    },
  });
}

async function handleStripeCheckoutSessionSubscriptionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const subRef = session.subscription;
  const subId = typeof subRef === 'string' ? subRef : subRef?.id;
  if (!subId) throw serviceError('Sesión Stripe sin suscripción', 400);
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);
  await syncStripeSubscriptionToProfile(sub);
}

async function handleStripeSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const userId = await resolveUserIdForStripeSubscription(sub);
  if (!userId) return;
  await prisma.profile.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      subscriptionCancelAtPeriodEnd: false,
      subscriptionTier: 'free',
      subscriptionExpiresAt: null,
    },
  });
}

async function handleStripeInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subRef = invoice.subscription;
  const subId = typeof subRef === 'string' ? subRef : subRef?.id;
  if (!subId) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subId);
  await syncStripeSubscriptionToProfile(sub);

  const amountCents = invoice.amount_paid ?? 0;
  if (!invoice.id || amountCents <= 0) return;

  const userId = await resolveUserIdForStripeSubscription(sub);
  if (!userId) return;
  const tier = tierFromStripeSubscription(sub);
  if (!tier) return;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.payment.findUnique({
      where: {
        provider_externalId: { provider: PaymentProvider.stripe, externalId: invoice.id! },
      },
    });
    if (existing?.status === PaymentStatus.completed) return;

    if (existing && existing.userId !== userId) {
      throw serviceError('Conflicto de identidad en factura', 400);
    }

    const meta = { invoiceId: invoice.id, subscriptionId: subId } satisfies Record<string, string>;

    if (existing) {
      await tx.payment.update({
        where: { id: existing.id },
        data: {
          status: PaymentStatus.completed,
          amount: amountCents,
          currency: (invoice.currency ?? 'mxn').toLowerCase(),
          tier: tier as SubscriptionTier,
          metadata: meta,
        },
      });
    } else {
      await tx.payment.create({
        data: {
          userId,
          provider: PaymentProvider.stripe,
          externalId: invoice.id!,
          amount: amountCents,
          currency: (invoice.currency ?? 'mxn').toLowerCase(),
          status: PaymentStatus.completed,
          tier: tier as SubscriptionTier,
          metadata: meta,
        },
      });
    }
  });
}

export async function recordSubscriptionCancellationFeedback(
  userId: string,
  provider: PaymentProvider,
  feedback: { reason: SubscriptionCancelReason; details?: string | null }
): Promise<void> {
  const details = feedback.details?.trim();
  await prisma.subscriptionCancellationFeedback.create({
    data: {
      userId,
      provider,
      reason: feedback.reason,
      details: details || null,
    },
  });
}

export async function cancelStripeSubscription(
  userId: string,
  feedback: { reason: SubscriptionCancelReason; details?: string | null }
): Promise<void> {
  const stripe = getStripe();
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });
  if (!profile?.stripeSubscriptionId) {
    throw serviceError('No hay suscripción activa de Stripe', 400);
  }
  const sub = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
  const resolved = await resolveUserIdForStripeSubscription(sub);
  if (resolved !== userId) {
    throw serviceError('La suscripción no corresponde a este usuario', 403);
  }
  await stripe.subscriptions.update(profile.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  await prisma.profile.update({
    where: { id: userId },
    data: { subscriptionCancelAtPeriodEnd: true },
  });
  await recordSubscriptionCancellationFeedback(userId, PaymentProvider.stripe, feedback);
}

export async function processStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<void> {
  if (!env.STRIPE_WEBHOOK_SECRET) throw serviceError('Webhook Stripe no configurado', 503);
  if (!signature) throw serviceError('Firma Stripe ausente', 400);

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Firma inválida';
    throw serviceError(msg, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription') {
        await handleStripeCheckoutSessionSubscriptionCompleted(session);
        return;
      }
      const userId = session.metadata?.userId ?? session.client_reference_id;
      const tierRaw = session.metadata?.tier;
      if (!userId || !tierRaw || !isPaidTier(tierRaw)) {
        throw serviceError('Metadatos de sesión Stripe incompletos', 400);
      }
      const amountTotal = session.amount_total;
      if (amountTotal == null) throw serviceError('Sesión Stripe sin monto', 400);

      const stripeCustomerId =
        typeof session.customer === 'string' ? session.customer : (session.customer as { id?: string } | null)?.id;

      await applyCompletedPayment({
        userId,
        provider: PaymentProvider.stripe,
        externalId: session.id,
        amountCents: amountTotal,
        currency: session.currency ?? 'mxn',
        tier: tierRaw,
        stripeCustomerId: stripeCustomerId ?? undefined,
        metadata: { sessionId: session.id, paymentStatus: session.payment_status },
      });
      return;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await syncStripeSubscriptionToProfile(sub);
      return;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await handleStripeSubscriptionDeleted(sub);
      return;
    }
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await handleStripeInvoicePaid(invoice);
      }
      return;
    }
    default:
      return;
  }
}

export async function createPayPalOrder(userId: string, tier: PaidTier): Promise<{ approvalUrl: string }> {
  const plan = await getActiveSubscriptionPlanForTier(tier);
  const paypalAmount = plan.price.toFixed(2);
  const base = requirePublicFrontendBaseUrlForPayments();
  const customId = `${userId}:${tier}`;

  const res = await paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'MXN', value: paypalAmount },
          custom_id: customId,
        },
      ],
      application_context: {
        return_url: `${base}/dashboard/subscription?paypal_return=1`,
        cancel_url: `${base}/dashboard/subscription?canceled=paypal`,
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw serviceError(`PayPal crear orden falló: ${t}`, 502);
  }

  const order = (await res.json()) as {
    id: string;
    links?: { href: string; rel: string; method?: string }[];
  };
  const approve = order.links?.find((l) => l.rel === 'approve')?.href;
  if (!approve) throw serviceError('PayPal no devolvió enlace de aprobación', 502);
  return { approvalUrl: approve };
}

export async function capturePayPalOrder(userId: string, orderId: string): Promise<void> {
  const getRes = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
  if (!getRes.ok) {
    const t = await getRes.text();
    throw serviceError(`PayPal orden no encontrada: ${t}`, 400);
  }
  const order = (await getRes.json()) as {
    status: string;
    purchase_units?: {
      custom_id?: string;
      payments?: {
        captures?: { id: string; amount?: { currency_code: string; value: string }; status?: string }[];
      };
    }[];
  };

  const customId = order.purchase_units?.[0]?.custom_id;
  const parsed = parsePayPalCustomId(customId);
  if (!parsed || parsed.userId !== userId) {
    throw serviceError('La orden no corresponde al usuario autenticado', 403);
  }

  let cap = order.purchase_units?.[0]?.payments?.captures?.[0];

  if (order.status === 'COMPLETED') {
    if (!cap?.id || cap.status !== 'COMPLETED' || !cap.amount) {
      throw serviceError('Orden PayPal completada sin datos de captura', 502);
    }
  } else if (order.status === 'APPROVED') {
    const capRes = await paypalFetch(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    if (!capRes.ok) {
      const t = await capRes.text();
      throw serviceError(`PayPal captura falló: ${t}`, 502);
    }
    const captured = (await capRes.json()) as {
      status: string;
      purchase_units?: {
        payments?: {
          captures?: { id: string; amount?: { currency_code: string; value: string }; status?: string }[];
        };
      }[];
    };
    if (captured.status !== 'COMPLETED') {
      throw serviceError(`Captura PayPal no completada: ${captured.status}`, 400);
    }
    cap = captured.purchase_units?.[0]?.payments?.captures?.[0];
    if (!cap?.id || cap.status !== 'COMPLETED' || !cap.amount) {
      throw serviceError('Respuesta de captura PayPal incompleta', 502);
    }
  } else {
    throw serviceError(`Estado de orden PayPal inesperado: ${order.status}`, 400);
  }

  const amountCents = paypalValueToCents(cap.amount!.value, cap.amount!.currency_code);

  await applyCompletedPayment({
    userId: parsed.userId,
    provider: PaymentProvider.paypal,
    externalId: cap.id,
    amountCents,
    currency: cap.amount!.currency_code,
    tier: parsed.tier,
    metadata: { orderId, captureId: cap.id },
  });
}

export async function verifyPayPalWebhookRequest(req: {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
}): Promise<boolean> {
  if (!env.PAYPAL_WEBHOOK_ID || !env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    if (env.NODE_ENV !== 'production') {
      console.warn('[payments] Verificación webhook PayPal omitida (falta PAYPAL_WEBHOOK_ID o credenciales)');
      return true;
    }
    return false;
  }

  const h = req.headers;
  const transmissionId = h['paypal-transmission-id'];
  const transmissionTime = h['paypal-transmission-time'];
  const certUrl = h['paypal-cert-url'];
  const authAlgo = h['paypal-auth-algo'];
  const transmissionSig = h['paypal-transmission-sig'];

  if (
    typeof transmissionId !== 'string' ||
    typeof transmissionTime !== 'string' ||
    typeof certUrl !== 'string' ||
    typeof authAlgo !== 'string' ||
    typeof transmissionSig !== 'string'
  ) {
    return false;
  }

  const token = await paypalAccessToken();
  const verifyRes = await fetch(`${paypalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: env.PAYPAL_WEBHOOK_ID,
      webhook_event: req.body,
    }),
  });

  if (!verifyRes.ok) return false;
  const verdict = (await verifyRes.json()) as { verification_status?: string };
  return verdict.verification_status === 'SUCCESS';
}

export async function processPayPalWebhookEvent(body: {
  event_type?: string;
  resource?: {
    id?: string;
    amount?: { currency_code?: string; value?: string; total?: string; currency?: string };
    custom_id?: string;
    billing_agreement_id?: string;
  };
}): Promise<void> {
  const eventType = body.event_type;

  switch (eventType) {
    case 'BILLING.SUBSCRIPTION.ACTIVATED':
    case 'BILLING.SUBSCRIPTION.UPDATED':
    case 'BILLING.SUBSCRIPTION.CANCELLED':
    case 'BILLING.SUBSCRIPTION.EXPIRED':
    case 'BILLING.SUBSCRIPTION.SUSPENDED': {
      const subId = body.resource?.id;
      if (!subId) return;
      try {
        const sub = await getPayPalSubscription(subId);
        await syncProfileFromPayPalSubscriptionResource(sub);
      } catch (e) {
        console.warn('[payments] Webhook PayPal suscripción:', e);
      }
      return;
    }
    case 'PAYMENT.SALE.COMPLETED': {
      const subId = body.resource?.billing_agreement_id;
      if (!subId) return;
      try {
        const sub = await getPayPalSubscription(subId);
        await syncProfileFromPayPalSubscriptionResource(sub);
        const saleId = body.resource?.id;
        const total = body.resource?.amount?.total;
        const currency = body.resource?.amount?.currency ?? 'MXN';
        if (saleId && total) {
          const amountCents = paypalValueToCents(total, currency);
          const parsed = parsePayPalCustomId(sub.custom_id);
          if (parsed) {
            await prisma.$transaction(async (tx) => {
              const existing = await tx.payment.findUnique({
                where: {
                  provider_externalId: { provider: PaymentProvider.paypal, externalId: saleId },
                },
              });
              if (existing?.status === PaymentStatus.completed) return;
              await tx.payment.create({
                data: {
                  userId: parsed.userId,
                  provider: PaymentProvider.paypal,
                  externalId: saleId,
                  amount: amountCents,
                  currency: currency.toLowerCase(),
                  status: PaymentStatus.completed,
                  tier: parsed.tier as SubscriptionTier,
                  metadata: { source: 'sale', subscriptionId: subId } as Prisma.InputJsonValue,
                },
              });
            });
          }
        }
      } catch (e) {
        console.warn('[payments] Webhook PayPal PAYMENT.SALE:', e);
      }
      return;
    }
    case 'PAYMENT.CAPTURE.COMPLETED': {
      const captureId = body.resource?.id;
      if (!captureId) return;

      let customId = body.resource?.custom_id;
      let amountValue = body.resource?.amount?.value;
      let currencyCode = body.resource?.amount?.currency_code;

      if (!customId || !amountValue || !currencyCode) {
        const detailRes = await paypalFetch(`/v2/payments/captures/${encodeURIComponent(captureId)}`, {
          method: 'GET',
        });
        if (!detailRes.ok) return;
        const detail = (await detailRes.json()) as {
          custom_id?: string;
          amount?: { currency_code?: string; value?: string };
        };
        customId = customId ?? detail.custom_id;
        amountValue = amountValue ?? detail.amount?.value;
        currencyCode = currencyCode ?? detail.amount?.currency_code;
      }

      const parsed = parsePayPalCustomId(customId);
      if (!parsed || !amountValue || !currencyCode) {
        console.warn('[payments] Webhook PayPal: no se pudo resolver custom_id/monto', captureId);
        return;
      }

      const amountCents = paypalValueToCents(amountValue, currencyCode);

      await applyCompletedPayment({
        userId: parsed.userId,
        provider: PaymentProvider.paypal,
        externalId: captureId,
        amountCents,
        currency: currencyCode,
        tier: parsed.tier,
        metadata: { source: 'webhook' },
      });
      return;
    }
    default:
      return;
  }
}

export type PaymentHistoryItem = {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  status: PaymentStatus;
  tier: SubscriptionTier;
};

export async function listPaymentsForUser(userId: string): Promise<PaymentHistoryItem[]> {
  const rows = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      amount: true,
      currency: true,
      provider: true,
      status: true,
      tier: true,
    },
  });
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    amount: r.amount,
    currency: r.currency,
    provider: r.provider,
    status: r.status,
    tier: r.tier,
  }));
}

/** Resolves a hosted receipt URL for Stripe payments; PayPal returns null. */
export async function getReceiptUrlForPayment(userId: string, paymentId: string): Promise<string | null> {
  const row = await prisma.payment.findFirst({
    where: { id: paymentId, userId },
    select: { provider: true, externalId: true },
  });
  if (!row) throw serviceError('Pago no encontrado', 404);
  if (row.provider === PaymentProvider.paypal) {
    return null;
  }
  const stripe = getStripe();
  const ext = row.externalId;
  if (ext.startsWith('in_')) {
    const inv = await stripe.invoices.retrieve(ext);
    return inv.hosted_invoice_url ?? inv.invoice_pdf ?? null;
  }
  if (ext.startsWith('cs_')) {
    const session = await stripe.checkout.sessions.retrieve(ext, { expand: ['invoice'] });
    if (session.invoice) {
      const inv =
        typeof session.invoice === 'string'
          ? await stripe.invoices.retrieve(session.invoice)
          : session.invoice;
      return inv.hosted_invoice_url ?? inv.invoice_pdf ?? null;
    }
    const piRef = session.payment_intent;
    const piId = typeof piRef === 'string' ? piRef : piRef?.id;
    if (piId) {
      const pi = await stripe.paymentIntents.retrieve(piId, { expand: ['latest_charge'] });
      const lc = pi.latest_charge;
      if (typeof lc === 'object' && lc && 'receipt_url' in lc) {
        return (lc as Stripe.Charge).receipt_url ?? null;
      }
    }
    return null;
  }
  return null;
}
