import { z } from 'zod';

export const specialtyCreateSchema = z.object({
  name: z.string().min(1),
});

export const specialtyUpdateSchema = z.object({
  name: z.string().min(1).optional(),
});

export const areaCreateSchema = z.object({
  name: z.string().min(1),
});

export const phraseCreateSchema = z.object({
  text: z.string().min(1),
  author: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const phraseUpdateSchema = phraseCreateSchema.partial();

export const flashcardCreateSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  hint: z.string().optional(),
  isActive: z.boolean().optional(),
  specialtyIds: z.array(z.string().uuid()).default([]),
  areaIds: z.array(z.string().uuid()).default([]),
});

export const flashcardUpdateSchema = flashcardCreateSchema.partial();

export const examDateCreateSchema = z.object({
  name: z.string().min(1),
  date: z.string().datetime(),
  isActive: z.boolean().optional(),
});

export const examDateUpdateSchema = examDateCreateSchema.partial();

export const planCreateSchema = z.object({
  name: z.string().min(1),
  price: z.number(),
  duration: z.number().int().positive(),
  features: z.string(),
  isActive: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  /** monthly | semester | annual — recomendado para enlazar con el checkout. */
  tier: z.enum(['monthly', 'semester', 'annual']).optional(),
  /** Plan de facturación PayPal (P-...), opcional si se crea por API. */
  paypalPlanId: z.string().min(1).optional(),
});

export const planUpdateSchema = planCreateSchema.partial();

export const promotionCodeCreateSchema = z.object({
  code: z.string().min(1),
  percentOff: z.number().int().min(1).max(100),
  maxRedemptions: z.number().int().positive().optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
});

export const promotionCodePatchSchema = z.object({
  isActive: z.boolean(),
});

export const userRoleUpdateSchema = z.object({
  roles: z.array(z.enum(['admin', 'editor', 'user'])).min(1),
});

/** Admin: actualizar correo y/o rol(es). Al menos uno de los dos. */
export const backofficeUserUpdateSchema = z
  .object({
    email: z.string().email().optional(),
    roles: z.array(z.enum(['admin', 'editor', 'user'])).min(1).optional(),
  })
  .refine((d) => d.email !== undefined || d.roles !== undefined, {
    message: 'Debe enviar email o roles',
  });

export const backofficeUserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  roles: z.array(z.enum(['admin', 'editor', 'user'])).min(1),
});

export const backofficeUsersQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(['admin', 'editor', 'user']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const examReviewsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const examReviewSubmitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(8000).optional(),
});

export const adminPushSubscribeSchema = z.object({
  endpoint: z.string().min(1),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const adminPushUnsubscribeSchema = z.object({
  endpoint: z.string().min(1),
});

export const adminPushPreferencesSchema = z
  .object({
    notifyNewUser: z.boolean().optional(),
    notifyNewSubscription: z.boolean().optional(),
    emailNotifyNewUser: z.boolean().optional(),
    emailNotifyNewSubscription: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.notifyNewUser !== undefined ||
      d.notifyNewSubscription !== undefined ||
      d.emailNotifyNewUser !== undefined ||
      d.emailNotifyNewSubscription !== undefined,
    { message: 'Envía al menos una preferencia' }
  );
