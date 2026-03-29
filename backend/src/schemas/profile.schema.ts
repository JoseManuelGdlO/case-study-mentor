import { z } from 'zod';

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  university: z.string().nullable().optional(),
  graduationYear: z.number().int().nullable().optional(),
  examDate: z.string().datetime().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
});
