import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';

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

export function normalizePromotionCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export type PromotionCodeCreateInput = {
  code: string;
  percentOff: number;
  maxRedemptions?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
};

export type PromotionCodeListRow = {
  id: string;
  code: string;
  percentOff: number;
  maxRedemptions: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  stripeCouponId: string;
  stripePromotionCodeId: string;
  createdAt: string;
  updatedAt: string;
  timesRedeemed: number;
};

function assertCodeShape(code: string): void {
  const n = normalizePromotionCode(code);
  if (n.length < 3 || n.length > 50) {
    throw serviceError('El código debe tener entre 3 y 50 caracteres', 400);
  }
  if (!/^[A-Z0-9_-]+$/.test(n)) {
    throw serviceError('El código solo puede incluir letras, números, guiones y guión bajo', 400);
  }
}

export async function createPromotionCode(input: PromotionCodeCreateInput): Promise<PromotionCodeListRow> {
  assertCodeShape(input.code);
  const normalized = normalizePromotionCode(input.code);
  if (input.percentOff < 1 || input.percentOff > 100 || !Number.isInteger(input.percentOff)) {
    throw serviceError('El descuento debe ser un porcentaje entero entre 1 y 100', 400);
  }
  if (input.maxRedemptions != null) {
    if (!Number.isInteger(input.maxRedemptions) || input.maxRedemptions < 1) {
      throw serviceError('El límite de usos debe ser un entero mayor a 0', 400);
    }
  }
  const now = new Date();
  if (input.validFrom && input.validUntil && input.validUntil < input.validFrom) {
    throw serviceError('La vigencia final debe ser posterior al inicio', 400);
  }
  if (input.validUntil && input.validUntil < now) {
    throw serviceError('La vigencia final ya pasó', 400);
  }

  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    percent_off: input.percentOff,
    duration: 'once',
    name: `sub_first_invoice_${normalized.slice(0, 20)}`,
  });

  const promoParams: Stripe.PromotionCodeCreateParams = {
    coupon: coupon.id,
    code: normalized,
    active: true,
  };
  if (input.maxRedemptions != null) {
    promoParams.max_redemptions = input.maxRedemptions;
  }
  if (input.validUntil) {
    promoParams.expires_at = Math.floor(input.validUntil.getTime() / 1000);
  }

  let promotion: Stripe.PromotionCode;
  try {
    promotion = await stripe.promotionCodes.create(promoParams);
  } catch (err) {
    await stripe.coupons.del(coupon.id).catch(() => undefined);
    const msg = err instanceof Error ? err.message : 'Error creando código en Stripe';
    throw serviceError(msg, 502);
  }

  try {
    const row = await prisma.promotionCode.create({
      data: {
        code: normalized,
        percentOff: input.percentOff,
        maxRedemptions: input.maxRedemptions ?? null,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
        isActive: true,
        stripeCouponId: coupon.id,
        stripePromotionCodeId: promotion.id,
      },
    });
    return await toListRow(row);
  } catch (err) {
    await stripe.promotionCodes.update(promotion.id, { active: false }).catch(() => undefined);
    await stripe.coupons.del(coupon.id).catch(() => undefined);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw serviceError('Ya existe un código promocional con ese texto', 409);
    }
    throw err;
  }
}

async function toListRow(row: {
  id: string;
  code: string;
  percentOff: number;
  maxRedemptions: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
  isActive: boolean;
  stripeCouponId: string;
  stripePromotionCodeId: string;
  createdAt: Date;
  updatedAt: Date;
}): Promise<PromotionCodeListRow> {
  const stripe = getStripe();
  const remote = await stripe.promotionCodes.retrieve(row.stripePromotionCodeId);
  return {
    id: row.id,
    code: row.code,
    percentOff: row.percentOff,
    maxRedemptions: row.maxRedemptions,
    validFrom: row.validFrom?.toISOString() ?? null,
    validUntil: row.validUntil?.toISOString() ?? null,
    isActive: row.isActive,
    stripeCouponId: row.stripeCouponId,
    stripePromotionCodeId: row.stripePromotionCodeId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    timesRedeemed: remote.times_redeemed ?? 0,
  };
}

export async function listPromotionCodes(): Promise<PromotionCodeListRow[]> {
  const rows = await prisma.promotionCode.findMany({ orderBy: { createdAt: 'desc' } });
  return Promise.all(rows.map((r) => toListRow(r)));
}

export async function setPromotionCodeActive(id: string, isActive: boolean): Promise<PromotionCodeListRow> {
  const row = await prisma.promotionCode.findUnique({ where: { id } });
  if (!row) throw serviceError('Código promocional no encontrado', 404);

  const stripe = getStripe();
  await stripe.promotionCodes.update(row.stripePromotionCodeId, { active: isActive });

  const updated = await prisma.promotionCode.update({
    where: { id },
    data: { isActive },
  });
  return toListRow(updated);
}

async function assertCheckoutEligible(
  row: NonNullable<Awaited<ReturnType<typeof prisma.promotionCode.findUnique>>>,
  userId: string
): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });
  if (!profile) throw serviceError('Usuario no encontrado', 404);
  if (profile.stripeSubscriptionId) {
    throw serviceError(
      'Los códigos de promoción solo aplican a nuevas suscripciones con Stripe. Ya tienes una suscripción activa.',
      409
    );
  }

  if (!row.isActive) {
    throw serviceError('Este código promocional no está activo', 400);
  }

  const now = new Date();
  if (row.validFrom && row.validFrom > now) {
    throw serviceError('Este código aún no es válido', 400);
  }
  if (row.validUntil && row.validUntil < now) {
    throw serviceError('Este código promocional ha expirado', 400);
  }

  const stripe = getStripe();
  const remote = await stripe.promotionCodes.retrieve(row.stripePromotionCodeId);
  if (!remote.active) {
    throw serviceError('Este código promocional no está activo', 400);
  }
  if (remote.expires_at && remote.expires_at * 1000 < now.getTime()) {
    throw serviceError('Este código promocional ha expirado', 400);
  }
  const max = remote.max_redemptions;
  if (max != null && (remote.times_redeemed ?? 0) >= max) {
    throw serviceError('Este código promocional ya alcanzó el límite de usos', 400);
  }
}

/** Devuelve el id de Promotion Code de Stripe o null si no se envió código. */
export async function resolvePromotionCodeForCheckout(
  userId: string,
  rawCode: string | undefined
): Promise<{ stripePromotionCodeId: string; promotionCodeId: string } | null> {
  if (rawCode == null || !normalizePromotionCode(rawCode)) {
    return null;
  }
  const normalized = normalizePromotionCode(rawCode);
  const row = await prisma.promotionCode.findUnique({ where: { code: normalized } });
  if (!row) {
    throw serviceError('Código promocional no válido', 400);
  }
  await assertCheckoutEligible(row, userId);
  return { stripePromotionCodeId: row.stripePromotionCodeId, promotionCodeId: row.id };
}

export type ValidatePromotionResult =
  | { valid: true; percentOff: number }
  | { valid: false; message: string };

export async function validatePromotionCodeForUser(userId: string, rawCode: string): Promise<ValidatePromotionResult> {
  if (!normalizePromotionCode(rawCode)) {
    return { valid: false, message: 'Ingresa un código' };
  }
  const normalized = normalizePromotionCode(rawCode);
  const row = await prisma.promotionCode.findUnique({ where: { code: normalized } });
  if (!row) {
    return { valid: false, message: 'Código promocional no válido' };
  }
  try {
    await assertCheckoutEligible(row, userId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'No se puede aplicar este código';
    return { valid: false, message: msg };
  }
  return { valid: true, percentOff: row.percentOff };
}
