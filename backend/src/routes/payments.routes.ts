import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { checkoutTierSchema, paypalCaptureSchema } from '../schemas/payment.schema.js';
import * as paymentService from '../services/payment.service.js';

export async function stripeWebhookHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sig = req.headers['stripe-signature'];
    const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body));
    await paymentService.processStripeWebhook(raw, typeof sig === 'string' ? sig : undefined);
    res.json({ received: true });
  } catch (e) {
    next(e);
  }
}

export async function paypalWebhookHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ok = await paymentService.verifyPayPalWebhookRequest(req);
    if (!ok) {
      res.status(400).send('Invalid webhook');
      return;
    }
    await paymentService.processPayPalWebhookEvent(
      req.body as {
        event_type?: string;
        resource?: { id?: string; amount?: { currency_code?: string; value?: string }; custom_id?: string };
      }
    );
    res.status(200).send('OK');
  } catch (e) {
    next(e);
  }
}

export const paymentsRouter = Router();

paymentsRouter.post(
  '/stripe/checkout-session',
  authenticate,
  validateBody(checkoutTierSchema),
  async (req, res, next) => {
    try {
      if (!req.user) throw new Error('No user');
      const { tier } = req.body as { tier: 'monthly' | 'semester' | 'annual' };
      const { url } = await paymentService.createStripeCheckoutSession(req.user.id, tier);
      res.json({ data: { url } });
    } catch (e) {
      next(e);
    }
  }
);

paymentsRouter.post('/paypal/create-order', authenticate, validateBody(checkoutTierSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new Error('No user');
    const { tier } = req.body as { tier: 'monthly' | 'semester' | 'annual' };
    const { approvalUrl } = await paymentService.createPayPalOrder(req.user.id, tier);
    res.json({ data: { approvalUrl } });
  } catch (e) {
    next(e);
  }
});

paymentsRouter.post('/paypal/capture', authenticate, validateBody(paypalCaptureSchema), async (req, res, next) => {
  try {
    if (!req.user) throw new Error('No user');
    const { orderId } = req.body as { orderId: string };
    await paymentService.capturePayPalOrder(req.user.id, orderId);
    res.json({ data: { ok: true } });
  } catch (e) {
    next(e);
  }
});
