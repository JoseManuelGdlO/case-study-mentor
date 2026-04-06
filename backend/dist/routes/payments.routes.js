import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { PaymentProvider } from '@prisma/client';
import { checkoutTierSchema, paypalCaptureSchema, paypalSubscriptionConfirmSchema, subscriptionCancelFeedbackSchema, subscriptionCheckoutSchema, validatePromotionCodeBodySchema, } from '../schemas/payment.schema.js';
import * as paypalBillingService from '../services/paypal-billing.service.js';
import * as paymentService from '../services/payment.service.js';
import { resolvePromotionCodeForCheckout, validatePromotionCodeForUser, } from '../services/promotion-code.service.js';
export async function stripeWebhookHandler(req, res, next) {
    try {
        const sig = req.headers['stripe-signature'];
        const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
        await paymentService.processStripeWebhook(raw, typeof sig === 'string' ? sig : undefined);
        res.json({ received: true });
    }
    catch (e) {
        next(e);
    }
}
export async function paypalWebhookHandler(req, res, next) {
    try {
        const ok = await paymentService.verifyPayPalWebhookRequest(req);
        if (!ok) {
            res.status(400).send('Invalid webhook');
            return;
        }
        await paymentService.processPayPalWebhookEvent(req.body);
        res.status(200).send('OK');
    }
    catch (e) {
        next(e);
    }
}
export const paymentsRouter = Router();
paymentsRouter.get('/history', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const payments = await paymentService.listPaymentsForUser(req.user.id);
        res.json({ data: { payments } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.get('/:paymentId/receipt', authenticate, async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const rawId = req.params.paymentId;
        const paymentId = Array.isArray(rawId) ? rawId[0] : rawId;
        if (!paymentId) {
            res.status(400).json({ error: 'Falta el identificador del pago' });
            return;
        }
        const receiptUrl = await paymentService.getReceiptUrlForPayment(req.user.id, paymentId);
        if (!receiptUrl) {
            res.status(404).json({ error: 'No hay recibo disponible para este pago' });
            return;
        }
        res.json({ data: { url: receiptUrl } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/stripe/checkout-session', authenticate, validateBody(checkoutTierSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { tier } = req.body;
        const { url } = await paymentService.createStripeCheckoutSession(req.user.id, tier);
        res.json({ data: { url } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/stripe/validate-promotion-code', authenticate, validateBody(validatePromotionCodeBodySchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { code } = req.body;
        const result = await validatePromotionCodeForUser(req.user.id, code);
        res.json({ data: result });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/stripe/subscription-checkout', authenticate, validateBody(subscriptionCheckoutSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { tier, promotionCode } = req.body;
        const promotion = await resolvePromotionCodeForCheckout(req.user.id, promotionCode);
        const { url } = await paymentService.createStripeSubscriptionCheckoutSession(req.user.id, tier, promotion);
        res.json({ data: { url } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/stripe/cancel-subscription', authenticate, validateBody(subscriptionCancelFeedbackSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { reason, details } = req.body;
        await paymentService.cancelStripeSubscription(req.user.id, { reason, details });
        res.json({ data: { ok: true } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/paypal/create-order', authenticate, validateBody(checkoutTierSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { tier } = req.body;
        const { approvalUrl } = await paymentService.createPayPalOrder(req.user.id, tier);
        res.json({ data: { approvalUrl } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/paypal/create-subscription', authenticate, validateBody(checkoutTierSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { tier } = req.body;
        const { approvalUrl } = await paypalBillingService.createPayPalSubscriptionCheckout(req.user.id, tier);
        res.json({ data: { approvalUrl } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/paypal/subscription-confirm', authenticate, validateBody(paypalSubscriptionConfirmSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { subscriptionId } = req.body;
        await paypalBillingService.confirmPayPalSubscriptionAfterApproval(req.user.id, subscriptionId);
        res.json({ data: { ok: true } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/paypal/cancel-subscription', authenticate, validateBody(subscriptionCancelFeedbackSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { reason, details } = req.body;
        await paypalBillingService.cancelPayPalSubscriptionForUser(req.user.id);
        await paymentService.recordSubscriptionCancellationFeedback(req.user.id, PaymentProvider.paypal, {
            reason,
            details,
        });
        res.json({ data: { ok: true } });
    }
    catch (e) {
        next(e);
    }
});
paymentsRouter.post('/paypal/capture', authenticate, validateBody(paypalCaptureSchema), async (req, res, next) => {
    try {
        if (!req.user)
            throw new Error('No user');
        const { orderId } = req.body;
        await paymentService.capturePayPalOrder(req.user.id, orderId);
        res.json({ data: { ok: true } });
    }
    catch (e) {
        next(e);
    }
});
//# sourceMappingURL=payments.routes.js.map