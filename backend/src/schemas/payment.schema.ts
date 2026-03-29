import { z } from 'zod';

export const checkoutTierSchema = z.object({
  tier: z.enum(['monthly', 'semester', 'annual']),
});

export const paypalCaptureSchema = z.object({
  orderId: z.string().min(1),
});
