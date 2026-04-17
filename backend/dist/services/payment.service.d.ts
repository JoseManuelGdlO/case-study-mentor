import { PaymentProvider, PaymentStatus, type Prisma, type SubscriptionCancelReason, type SubscriptionTier } from '@prisma/client';
import { type PaidTier } from '../config/plans.js';
export declare function applyCompletedPayment(input: {
    userId: string;
    provider: PaymentProvider;
    externalId: string;
    amountCents: number;
    currency: string;
    tier: PaidTier;
    stripeCustomerId?: string | null;
    metadata?: Prisma.InputJsonValue;
}): Promise<void>;
export declare function createStripeCheckoutSession(userId: string, tier: PaidTier): Promise<{
    url: string;
}>;
export declare function createStripeSubscriptionCheckoutSession(userId: string, tier: PaidTier, promotion?: {
    stripePromotionCodeId: string;
    promotionCodeId: string;
} | null, collaboratorCodeId?: string | null): Promise<{
    url: string;
}>;
export declare function recordSubscriptionCancellationFeedback(userId: string, provider: PaymentProvider, feedback: {
    reason: SubscriptionCancelReason;
    details?: string | null;
}): Promise<void>;
export declare function cancelStripeSubscription(userId: string, feedback: {
    reason: SubscriptionCancelReason;
    details?: string | null;
}): Promise<void>;
export declare function processStripeWebhook(rawBody: Buffer, signature: string | undefined): Promise<void>;
export declare function createPayPalOrder(userId: string, tier: PaidTier): Promise<{
    approvalUrl: string;
}>;
export declare function capturePayPalOrder(userId: string, orderId: string): Promise<void>;
export declare function verifyPayPalWebhookRequest(req: {
    headers: Record<string, string | string[] | undefined>;
    body: unknown;
}): Promise<boolean>;
export declare function processPayPalWebhookEvent(body: {
    event_type?: string;
    resource?: {
        id?: string;
        amount?: {
            currency_code?: string;
            value?: string;
            total?: string;
            currency?: string;
        };
        custom_id?: string;
        billing_agreement_id?: string;
    };
}): Promise<void>;
export type PaymentHistoryItem = {
    id: string;
    createdAt: string;
    amount: number;
    currency: string;
    provider: PaymentProvider;
    status: PaymentStatus;
    tier: SubscriptionTier;
};
export declare function listPaymentsForUser(userId: string): Promise<PaymentHistoryItem[]>;
/** Resolves a hosted receipt URL for Stripe payments; PayPal returns null. */
export declare function getReceiptUrlForPayment(userId: string, paymentId: string): Promise<string | null>;
//# sourceMappingURL=payment.service.d.ts.map