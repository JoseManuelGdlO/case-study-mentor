import { z } from 'zod';

export const platformSuggestionSubmitSchema = z.object({
  message: z.string().min(10).max(4000),
  source: z.enum(['modal', 'mailbox']).optional(),
});
