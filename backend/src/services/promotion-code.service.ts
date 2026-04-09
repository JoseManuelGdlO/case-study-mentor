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

function isStripeDuplicatePromotionCodeError(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  if (e?.code === 'resource_already_exists') return true;
  const m = (e?.message ?? '').toLowerCase();
  return (
    m.includes('already been taken') ||
    m.includes('already exists') ||
    m.includes('duplicate') ||
    m.includes('already been used')
  );
}

/** El SDK Node no expone `del` en promotion_codes; la API REST permite borrar y liberar el texto del código. */
async function deleteStripePromotionCodeRemote(stripePromotionCodeId: string): Promise<void> {
  const key = env.STRIPE_SECRET_KEY;
  if (!key) return;
  const res = await fetch(
    `https://api.stripe.com/v1/promotion_codes/${encodeURIComponent(stripePromotionCodeId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${key}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '');
    throw serviceError(`Stripe no permitió eliminar el código promocional (${res.status}): ${text}`, 502);
  }
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

function validatePromotionInput(input: PromotionCodeCreateInput): {
  normalized: string;
  maxRedemptions: number | null;
  validFrom: Date | null;
  validUntil: Date | null;
} {
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
  const validFrom = input.validFrom ?? null;
  const validUntil = input.validUntil ?? null;
  if (validFrom && validUntil && validUntil < validFrom) {
    throw serviceError('La vigencia final debe ser posterior al inicio', 400);
  }
  if (validUntil && validUntil < now) {
    throw serviceError('La vigencia final ya pasó', 400);
  }
  return {
    normalized,
    maxRedemptions: input.maxRedemptions ?? null,
    validFrom,
    validUntil,
  };
}

function sameUtcInstant(a: Date | null, b: Date | null): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return a.getTime() === b.getTime();
}

async function createStripeCouponAndPromotionCode(
  normalized: string,
  percentOff: number,
  maxRedemptions: number | null,
  validUntil: Date | null,
  promoActive: boolean
): Promise<{ coupon: Stripe.Coupon; promotion: Stripe.PromotionCode }> {
  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'once',
    name: `sub_first_invoice_${normalized.slice(0, 20)}`,
  });

  const promoParams: Stripe.PromotionCodeCreateParams = {
    coupon: coupon.id,
    code: normalized,
    active: promoActive,
  };
  if (maxRedemptions != null) {
    promoParams.max_redemptions = maxRedemptions;
  }
  if (validUntil) {
    promoParams.expires_at = Math.floor(validUntil.getTime() / 1000);
  }

  let promotion: Stripe.PromotionCode;
  try {
    promotion = await stripe.promotionCodes.create(promoParams);
  } catch (err) {
    await stripe.coupons.del(coupon.id).catch(() => undefined);
    const msg = err instanceof Error ? err.message : 'Error creando código en Stripe';
    throw serviceError(msg, 502);
  }
  return { coupon, promotion };
}

async function deactivateAndDropStripePromotion(
  stripePromotionCodeId: string,
  stripeCouponId: string
): Promise<void> {
  const stripe = getStripe();
  try {
    await deleteStripePromotionCodeRemote(stripePromotionCodeId);
  } catch {
    await stripe.promotionCodes.update(stripePromotionCodeId, { active: false }).catch(() => undefined);
  }
  await stripe.coupons.del(stripeCouponId).catch(() => undefined);
}

/** Reemplazo en Stripe al editar cupón/código/vigencia; si el texto del código no cambia, puede hacer falta borrar el promotion code anterior en la API. */
async function createStripeCouponAndPromotionCodeForReplace(
  existing: { stripePromotionCodeId: string; stripeCouponId: string; code: string },
  normalized: string,
  percentOff: number,
  maxRedemptions: number | null,
  validUntil: Date | null,
  nextIsActive: boolean
): Promise<{ coupon: Stripe.Coupon; promotion: Stripe.PromotionCode }> {
  const stripe = getStripe();
  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration: 'once',
    name: `sub_first_invoice_${normalized.slice(0, 20)}`,
  });

  const promoParams: Stripe.PromotionCodeCreateParams = {
    coupon: coupon.id,
    code: normalized,
    active: nextIsActive,
  };
  if (maxRedemptions != null) {
    promoParams.max_redemptions = maxRedemptions;
  }
  if (validUntil) {
    promoParams.expires_at = Math.floor(validUntil.getTime() / 1000);
  }

  const tryCreate = () => stripe.promotionCodes.create(promoParams);

  let promotion: Stripe.PromotionCode;
  try {
    promotion = await tryCreate();
  } catch (err) {
    const sameText = normalized === existing.code;
    if (sameText && isStripeDuplicatePromotionCodeError(err)) {
      try {
        await deleteStripePromotionCodeRemote(existing.stripePromotionCodeId);
      } catch {
        await stripe.promotionCodes.update(existing.stripePromotionCodeId, { active: false }).catch(() => undefined);
      }
      await stripe.coupons.del(existing.stripeCouponId).catch(() => undefined);
      try {
        promotion = await tryCreate();
      } catch (err2) {
        await stripe.coupons.del(coupon.id).catch(() => undefined);
        const msg = err2 instanceof Error ? err2.message : 'Error en Stripe';
        throw serviceError(
          `${msg} Revisa Stripe o crea un código nuevo en el backoffice.`,
          502
        );
      }
    } else {
      await stripe.coupons.del(coupon.id).catch(() => undefined);
      const msg = err instanceof Error ? err.message : 'Error creando código en Stripe';
      throw serviceError(msg, 502);
    }
  }

  return { coupon, promotion };
}

export async function createPromotionCode(input: PromotionCodeCreateInput): Promise<PromotionCodeListRow> {
  const { normalized, maxRedemptions, validFrom, validUntil } = validatePromotionInput(input);

  const collabConflict = await prisma.collaboratorCode.findUnique({
    where: { code: normalized },
    select: { id: true },
  });
  if (collabConflict) {
    throw serviceError('Ese código ya está reservado para un colaborador', 409);
  }

  const { coupon, promotion } = await createStripeCouponAndPromotionCode(
    normalized,
    input.percentOff,
    maxRedemptions,
    validUntil,
    true
  );

  try {
    const row = await prisma.promotionCode.create({
      data: {
        code: normalized,
        percentOff: input.percentOff,
        maxRedemptions,
        validFrom,
        validUntil,
        isActive: true,
        stripeCouponId: coupon.id,
        stripePromotionCodeId: promotion.id,
      },
    });
    return await toListRow(row);
  } catch (err) {
    await deactivateAndDropStripePromotion(promotion.id, coupon.id);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw serviceError('Ya existe un código promocional con ese texto', 409);
    }
    throw err;
  }
}

export type PromotionCodeUpdateInput = PromotionCodeCreateInput & { isActive?: boolean };

export async function updatePromotionCode(id: string, input: PromotionCodeUpdateInput): Promise<PromotionCodeListRow> {
  const row = await prisma.promotionCode.findUnique({ where: { id } });
  if (!row) throw serviceError('Código promocional no encontrado', 404);

  const { normalized, maxRedemptions, validFrom, validUntil } = validatePromotionInput(input);
  const nextIsActive = input.isActive ?? row.isActive;

  if (normalized !== row.code) {
    const conflict = await prisma.promotionCode.findUnique({ where: { code: normalized } });
    if (conflict && conflict.id !== id) {
      throw serviceError('Ya existe un código promocional con ese texto', 409);
    }
  }

  const stripeFieldsChanged =
    normalized !== row.code ||
    input.percentOff !== row.percentOff ||
    maxRedemptions !== (row.maxRedemptions ?? null) ||
    !sameUtcInstant(validUntil, row.validUntil);

  const nothingChanged =
    !stripeFieldsChanged &&
    nextIsActive === row.isActive &&
    sameUtcInstant(validFrom, row.validFrom);

  if (nothingChanged) {
    return toListRow(row);
  }

  if (!stripeFieldsChanged) {
    const stripe = getStripe();
    if (nextIsActive !== row.isActive) {
      await stripe.promotionCodes.update(row.stripePromotionCodeId, { active: nextIsActive });
    }
    const updated = await prisma.promotionCode.update({
      where: { id },
      data: {
        validFrom,
        validUntil,
        isActive: nextIsActive,
      },
    });
    return toListRow(updated);
  }

  const oldPromoId = row.stripePromotionCodeId;
  const oldCouponId = row.stripeCouponId;

  const { coupon, promotion } = await createStripeCouponAndPromotionCodeForReplace(
    {
      stripePromotionCodeId: row.stripePromotionCodeId,
      stripeCouponId: row.stripeCouponId,
      code: row.code,
    },
    normalized,
    input.percentOff,
    maxRedemptions,
    validUntil,
    nextIsActive
  );

  try {
    const updated = await prisma.promotionCode.update({
      where: { id },
      data: {
        code: normalized,
        percentOff: input.percentOff,
        maxRedemptions,
        validFrom,
        validUntil,
        isActive: nextIsActive,
        stripeCouponId: coupon.id,
        stripePromotionCodeId: promotion.id,
      },
    });
    await deactivateAndDropStripePromotion(oldPromoId, oldCouponId);
    return toListRow(updated);
  } catch (err) {
    await deactivateAndDropStripePromotion(promotion.id, coupon.id);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw serviceError('Ya existe un código promocional con ese texto', 409);
    }
    throw err;
  }
}

export async function deletePromotionCode(id: string): Promise<void> {
  const row = await prisma.promotionCode.findUnique({ where: { id } });
  if (!row) throw serviceError('Código promocional no encontrado', 404);
  await deactivateAndDropStripePromotion(row.stripePromotionCodeId, row.stripeCouponId);
  await prisma.promotionCode.delete({ where: { id } });
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

export async function assertCheckoutEligible(
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
