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

export const userRoleUpdateSchema = z.object({
  roles: z.array(z.enum(['admin', 'editor', 'user'])).min(1),
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
  page: z.string().optional(),
  limit: z.string().optional(),
});
