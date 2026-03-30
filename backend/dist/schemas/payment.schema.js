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
export const subscriptionCancelFeedbackSchema = z.object({
    reason: z.enum([
        'too_expensive',
        'not_using_enough',
        'exam_finished_or_paused',
        'found_alternative',
        'technical_issues',
        'content_not_expected',
        'prefer_not_to_say',
        'other',
    ]),
    details: z.string().max(2000).optional().nullable(),
});
//# sourceMappingURL=payment.schema.js.map