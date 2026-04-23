import { z } from 'zod';

export const completeOnboardingSchema = z.object({
  desiredSpecialtyId: z.string().uuid().optional().nullable(),
});

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  university: z.string().nullable().optional(),
  graduationYear: z.number().int().nullable().optional(),
  examDate: z.string().datetime().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    newPasswordConfirm: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.newPasswordConfirm, {
    message: 'Las contraseñas nuevas no coinciden',
    path: ['newPasswordConfirm'],
  });

export const wellbeingPushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const wellbeingPushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const wellbeingNotificationPreferencesSchema = z.object({
  wellbeingPushEnabled: z.boolean().optional(),
  wellbeingReminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional()
    .nullable(),
  wellbeingReminderDays: z
    .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
    .max(7)
    .optional(),
});
