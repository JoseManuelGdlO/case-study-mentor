import { PaymentProvider, type Prisma } from '@prisma/client';
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
        };
        custom_id?: string;
    };
}): Promise<void>;
//# sourceMappingURL=payment.service.d.ts.map