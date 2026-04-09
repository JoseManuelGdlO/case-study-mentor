import { prisma } from '../config/database.js';
import {
  assertCheckoutEligible,
  createPromotionCode,
  deletePromotionCode,
  normalizePromotionCode,
  resolvePromotionCodeForCheckout,
  validatePromotionCodeForUser,
  type PromotionCodeCreateInput,
} from './promotion-code.service.js';

function serviceError(message: string, status: number): Error & { status: number } {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
}

async function assertNoStripeSubscriptionForPromoCheckout(userId: string): Promise<void> {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { stripeSubscriptionId: true },
  });
  if (!profile) throw serviceError('Usuario no encontrado', 404);
  if (profile.stripeSubscriptionId) {
    throw serviceError(
      'Los códigos solo aplican a nuevas suscripciones con Stripe. Ya tienes una suscripción activa.',
      409
    );
  }
}

export type CollaboratorCodeListRow = {
  id: string;
  code: string;
  displayName: string;
  promotionCodeId: string | null;
  percentOff: number | null;
  isActive: boolean;
  signupCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CollaboratorCodeCreateInput = {
  code: string;
  displayName: string;
  /** Si true, solo atribución; si false, se crea también PromotionCode con descuento. */
  attributionOnly: boolean;
  /** Requerido cuando attributionOnly es false */
  percentOff?: number;
  maxRedemptions?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
};

function assertCodeShapeForCollaborator(code: string): string {
  const n = normalizePromotionCode(code);
  if (n.length < 3 || n.length > 50) {
    throw serviceError('El código debe tener entre 3 y 50 caracteres', 400);
  }
  if (!/^[A-Z0-9_-]+$/.test(n)) {
    throw serviceError('El código solo puede incluir letras, números, guiones y guión bajo', 400);
  }
  return n;
}

export async function listCollaboratorCodes(): Promise<CollaboratorCodeListRow[]> {
  const rows = await prisma.collaboratorCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      promotionCode: { select: { percentOff: true } },
      _count: { select: { profiles: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    code: r.code,
    displayName: r.displayName,
    promotionCodeId: r.promotionCodeId,
    percentOff: r.promotionCode?.percentOff ?? null,
    isActive: r.isActive,
    signupCount: r._count.profiles,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createCollaboratorCode(input: CollaboratorCodeCreateInput): Promise<CollaboratorCodeListRow> {
  const normalized = assertCodeShapeForCollaborator(input.code);
  const displayName = input.displayName.trim();
  if (!displayName) throw serviceError('El nombre del colaborador es obligatorio', 400);

  const existingCollab = await prisma.collaboratorCode.findUnique({ where: { code: normalized } });
  if (existingCollab) throw serviceError('Ya existe un código de colaborador con ese texto', 409);

  const existingPromo = await prisma.promotionCode.findUnique({ where: { code: normalized } });
  if (existingPromo) {
    throw serviceError('Ese código ya existe como promoción. Usa otro texto o enlaza desde la edición.', 409);
  }

  if (input.attributionOnly) {
    const created = await prisma.collaboratorCode.create({
      data: {
        code: normalized,
        displayName,
        isActive: true,
      },
    });
    return (await listCollaboratorCodes()).find((r) => r.id === created.id)!;
  }

  const po = input.percentOff;
  if (po == null || !Number.isInteger(po) || po < 1 || po > 100) {
    throw serviceError('El descuento debe ser un entero entre 1 y 100', 400);
  }

  const promoInput: PromotionCodeCreateInput = {
    code: normalized,
    percentOff: po,
    maxRedemptions: input.maxRedemptions ?? null,
    validFrom: input.validFrom ?? null,
    validUntil: input.validUntil ?? null,
  };

  const promo = await createPromotionCode(promoInput);

  const created = await prisma.collaboratorCode.create({
    data: {
      code: normalized,
      displayName,
      promotionCodeId: promo.id,
      isActive: true,
    },
  });
  return (await listCollaboratorCodes()).find((r) => r.id === created.id)!;
}

export async function setCollaboratorCodeActive(id: string, isActive: boolean): Promise<CollaboratorCodeListRow> {
  const row = await prisma.collaboratorCode.findUnique({ where: { id } });
  if (!row) throw serviceError('Código de colaborador no encontrado', 404);
  await prisma.collaboratorCode.update({ where: { id }, data: { isActive } });
  return (await listCollaboratorCodes()).find((r) => r.id === id)!;
}

export async function updateCollaboratorCodeDisplayName(id: string, displayName: string): Promise<CollaboratorCodeListRow> {
  const trimmed = displayName.trim();
  if (!trimmed) throw serviceError('El nombre del colaborador es obligatorio', 400);
  const row = await prisma.collaboratorCode.findUnique({ where: { id } });
  if (!row) throw serviceError('Código de colaborador no encontrado', 404);
  await prisma.collaboratorCode.update({ where: { id }, data: { displayName: trimmed } });
  return (await listCollaboratorCodes()).find((r) => r.id === id)!;
}

export async function deleteCollaboratorCode(id: string): Promise<void> {
  const row = await prisma.collaboratorCode.findUnique({ where: { id } });
  if (!row) throw serviceError('Código de colaborador no encontrado', 404);
  const promoId = row.promotionCodeId;
  if (promoId) {
    await prisma.collaboratorCode.update({ where: { id }, data: { promotionCodeId: null } });
    await deletePromotionCode(promoId);
  }
  await prisma.collaboratorCode.delete({ where: { id } });
}

/** Resuelve colaborador primero; si no hay, código promocional standalone. */
/** PayPal no aplica cupones Stripe; rechazar código promocional “solo descuento” sin colaborador. */
export function assertPayPalSubscriptionCheckoutCodes(resolved: {
  promotion: { stripePromotionCodeId: string; promotionCodeId: string } | null;
  collaboratorCodeId: string | null;
}): void {
  if (resolved.promotion != null && resolved.collaboratorCodeId == null) {
    throw serviceError(
      'Los códigos promocionales con descuento solo aplican con pago por tarjeta (Stripe).',
      400
    );
  }
}

export async function resolveSubscriptionCheckoutCodes(
  userId: string,
  rawCode: string | undefined
): Promise<{
  promotion: { stripePromotionCodeId: string; promotionCodeId: string } | null;
  collaboratorCodeId: string | null;
}> {
  if (rawCode == null || !normalizePromotionCode(rawCode)) {
    return { promotion: null, collaboratorCodeId: null };
  }
  const normalized = normalizePromotionCode(rawCode);

  const collab = await prisma.collaboratorCode.findUnique({
    where: { code: normalized },
    include: { promotionCode: true },
  });

  if (collab) {
    if (!collab.isActive) throw serviceError('Este código de colaborador no está activo', 400);
    await assertNoStripeSubscriptionForPromoCheckout(userId);

    if (collab.promotionCodeId && collab.promotionCode) {
      await assertCheckoutEligible(collab.promotionCode, userId);
      return {
        promotion: {
          stripePromotionCodeId: collab.promotionCode.stripePromotionCodeId,
          promotionCodeId: collab.promotionCode.id,
        },
        collaboratorCodeId: collab.id,
      };
    }
    return { promotion: null, collaboratorCodeId: collab.id };
  }

  const promotion = await resolvePromotionCodeForCheckout(userId, rawCode);
  return { promotion, collaboratorCodeId: null };
}

export type ValidateCheckoutCodeResult =
  | { valid: true; kind: 'collaborator'; displayName: string; percentOff: number }
  | { valid: true; kind: 'promotion'; percentOff: number }
  | { valid: false; message: string };

export async function validateCheckoutCodeForUser(userId: string, rawCode: string): Promise<ValidateCheckoutCodeResult> {
  if (!normalizePromotionCode(rawCode)) {
    return { valid: false, message: 'Ingresa un código' };
  }
  const normalized = normalizePromotionCode(rawCode);

  const collab = await prisma.collaboratorCode.findUnique({
    where: { code: normalized },
    include: { promotionCode: true },
  });

  if (collab) {
    if (!collab.isActive) return { valid: false, message: 'Este código no está activo' };
    try {
      await assertNoStripeSubscriptionForPromoCheckout(userId);
      if (collab.promotionCode) {
        await assertCheckoutEligible(collab.promotionCode, userId);
        return {
          valid: true,
          kind: 'collaborator',
          displayName: collab.displayName,
          percentOff: collab.promotionCode.percentOff,
        };
      }
      return {
        valid: true,
        kind: 'collaborator',
        displayName: collab.displayName,
        percentOff: 0,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se puede aplicar este código';
      return { valid: false, message: msg };
    }
  }

  const promoResult = await validatePromotionCodeForUser(userId, rawCode);
  if (promoResult.valid) {
    return { valid: true, kind: 'promotion', percentOff: promoResult.percentOff };
  }
  return { valid: false, message: promoResult.message };
}

/**
 * Asigna colaborador al perfil la primera vez (no sobrescribe).
 * Valida que el id exista y esté activo.
 */
export async function assignCollaboratorCodeToProfileIfEmpty(
  userId: string,
  collaboratorCodeId: string | null | undefined
): Promise<void> {
  if (!collaboratorCodeId) return;
  const row = await prisma.collaboratorCode.findUnique({
    where: { id: collaboratorCodeId },
    select: { id: true, isActive: true },
  });
  if (!row || !row.isActive) return;

  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: { collaboratorCodeId: true },
  });
  if (!profile || profile.collaboratorCodeId) return;

  await prisma.profile.update({
    where: { id: userId },
    data: { collaboratorCodeId: row.id },
  });
}
