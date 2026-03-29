import Stripe from 'stripe';
import {
  PaymentProvider,
  PaymentStatus,
  type Prisma,
  type SubscriptionTier,
} from '@prisma/client';
import { prisma } from '../config/database.js';
import { env, getFrontendBaseUrl } from '../config/env.js';
import { isPaidTier, TIER_CHECKOUT, type PaidTier } from '../config/plans.js';

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

function paypalApiBase(): string {
  return env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

let paypalToken: { token: string; expiresAt: number } | null = null;

async function paypalAccessToken(): Promise<string> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw serviceError('PayPal no está configurado', 503);
  }
  const now = Date.now();
  if (paypalToken && paypalToken.expiresAt > now + 60_000) return paypalToken.token;

  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const t = await res.text();
    throw serviceError(`PayPal OAuth falló: ${t}`, 502);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  paypalToken = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 300) * 1000,
  };
  return json.access_token;
}

async function paypalFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await paypalAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return fetch(`${paypalApiBase()}${path}`, { ...init, headers });
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
  const cfg = TIER_CHECKOUT[input.tier];
  if (input.amountCents !== cfg.amountCents) {
    throw serviceError('El monto del pago no coincide con el plan', 400);
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
    const newExpires = new Date(base.getTime() + cfg.durationDays * 86_400_000);

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
  const cfg = TIER_CHECKOUT[tier];
  const base = getFrontendBaseUrl();

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: { name: cfg.stripeProductName },
          unit_amount: cfg.amountCents,
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

  if (event.type !== 'checkout.session.completed') return;

  const session = event.data.object as Stripe.Checkout.Session;
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
}

export async function createPayPalOrder(userId: string, tier: PaidTier): Promise<{ approvalUrl: string }> {
  const cfg = TIER_CHECKOUT[tier];
  const base = getFrontendBaseUrl();
  const customId = `${userId}:${tier}`;

  const res = await paypalFetch('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'MXN', value: cfg.paypalAmount },
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
  resource?: { id?: string; amount?: { currency_code?: string; value?: string }; custom_id?: string };
}): Promise<void> {
  if (body.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return;

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
}
