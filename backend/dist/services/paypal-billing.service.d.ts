import { type PaidTier } from '../config/plans.js';
/** Crea producto + plan en PayPal si la fila aún no tiene `paypalPlanId`, y lo activa. */
export declare function ensurePayPalBillingPlan(planRow: {
    id: string;
    name: string;
    price: number;
    duration: number;
    paypalPlanId: string | null;
}): Promise<string>;
export type PayPalSubscriptionApi = {
    id: string;
    status?: string;
    custom_id?: string;
    billing_info?: {
        next_billing_time?: string;
    };
};
export declare function getPayPalSubscription(subscriptionId: string): Promise<PayPalSubscriptionApi>;
export declare function syncProfileFromPayPalSubscriptionResource(sub: PayPalSubscriptionApi): Promise<void>;
export declare function createPayPalSubscriptionCheckout(userId: string, tier: PaidTier): Promise<{
    approvalUrl: string;
}>;
export declare function confirmPayPalSubscriptionAfterApproval(userId: string, subscriptionId: string): Promise<void>;
export declare function cancelPayPalSubscriptionForUser(userId: string): Promise<void>;
//# sourceMappingURL=paypal-billing.service.d.ts.map