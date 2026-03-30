import { z } from 'zod';

export const checkoutTierSchema = z.object({
  tier: z.enum(['monthly', 'semester', 'annual']),
});

export const paypalCaptureSchema = z.object({
  orderId: z.string().min(1),
});

export const paypalSubscriptionConfirmSchema = z.object({
  subscriptionId: z.string().min(1),
});
