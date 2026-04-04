import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser, type UserPlan } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { paidPlanFeatureBullets, subscriptionPricingPlans } from '@/constants/pricingPlans';
import { apiFetch, apiJson } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Crown, CreditCard, ArrowLeft, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

const plans = subscriptionPricingPlans;

/** Desactivar temporalmente el botón de checkout PayPal; poner en true cuando los pagos estén resueltos. */
const SHOW_PAYPAL_CHECKOUT = false;

async function pollProfileUntilPaid(maxAttempts = 8, delayMs = 900): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await apiFetch('/api/profile');
    if (res.ok) {
      const json = (await res.json()) as { data: { plan?: string } };
      if (json.data?.plan && json.data.plan !== 'free') return;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

const Subscription = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { plan: currentPlan, isFreeUser } = useUser();
  const { refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [payBusy, setPayBusy] = useState<'stripe' | 'paypal' | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; percentOff: number } | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);

  const clearPaymentQueryParams = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    [
      'paid',
      'session_id',
      'paypal_return',
      'paypal_sub_return',
      'subscription_id',
      'ba_token',
      'token',
      'PayerID',
      'canceled',
    ].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const canceled = searchParams.get('canceled');
    if (canceled === 'stripe' || canceled === 'paypal') {
      toast.message('Pago cancelado', { description: 'Puedes intentar de nuevo cuando quieras.' });
      clearPaymentQueryParams();
    }
  }, [searchParams, clearPaymentQueryParams]);

  useEffect(() => {
    const paid = searchParams.get('paid');
    if (paid !== 'stripe') return;

    let cancelled = false;
    (async () => {
      try {
        await pollProfileUntilPaid();
        if (!cancelled) await refreshUser();
        if (!cancelled) setShowSuccessModal(true);
      } catch {
        if (!cancelled) {
          toast.message('Estamos confirmando tu pago', {
            description: 'Si no ves tu plan en unos segundos, recarga la página.',
          });
          await refreshUser();
        }
      } finally {
        if (!cancelled) clearPaymentQueryParams();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, refreshUser, clearPaymentQueryParams]);

  useEffect(() => {
    const paypalSubReturn = searchParams.get('paypal_sub_return');
    if (paypalSubReturn === '1') {
      const subscriptionId =
        searchParams.get('subscription_id') ?? searchParams.get('token') ?? searchParams.get('ba_token');
      if (!subscriptionId) return;

      let cancelled = false;
      (async () => {
        try {
          await apiJson<{ data: { ok: boolean } }>('/api/payments/paypal/subscription-confirm', {
            method: 'POST',
            body: JSON.stringify({ subscriptionId }),
          });
          if (!cancelled) await refreshUser();
          if (!cancelled) setShowSuccessModal(true);
        } catch (e) {
          if (!cancelled) {
            toast.error(e instanceof Error ? e.message : 'No se pudo confirmar la suscripción con PayPal.');
          }
        } finally {
          if (!cancelled) clearPaymentQueryParams();
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    const paypalReturn = searchParams.get('paypal_return');
    const token = searchParams.get('token');
    if (paypalReturn !== '1' || !token) return;

    let cancelled = false;
    (async () => {
      try {
        await apiJson<{ data: { ok: boolean } }>('/api/payments/paypal/capture', {
          method: 'POST',
          body: JSON.stringify({ orderId: token }),
        });
        if (!cancelled) await refreshUser();
        if (!cancelled) setShowSuccessModal(true);
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : 'No se pudo confirmar el pago con PayPal.');
        }
      } finally {
        if (!cancelled) clearPaymentQueryParams();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, refreshUser, clearPaymentQueryParams]);

  const handleSelectPlan = (planId: UserPlan) => {
    if (planId === 'free') return;
    setSelectedPlan(planId);
    setShowPayment(true);
    setPromoInput('');
    setPromoApplied(null);
  };

  const applyPromoCode = async () => {
    const code = promoInput.trim();
    if (!code) {
      toast.message('Código vacío', { description: 'Escribe un código o continúa sin descuento.' });
      return;
    }
    setPromoBusy(true);
    try {
      const json = await apiJson<{
        data: { valid: true; percentOff: number } | { valid: false; message: string };
      }>('/api/payments/stripe/validate-promotion-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      if (json.data.valid) {
        setPromoApplied({ code, percentOff: json.data.percentOff });
        toast.success(`Código aplicado: ${json.data.percentOff}% en tu primer pago`);
      } else {
        setPromoApplied(null);
        toast.error(json.data.message);
      }
    } catch (e) {
      setPromoApplied(null);
      toast.error(e instanceof Error ? e.message : 'No se pudo validar el código.');
    } finally {
      setPromoBusy(false);
    }
  };

  const startStripe = async () => {
    if (!selectedPlan || selectedPlan === 'free') return;
    setPayBusy('stripe');
    try {
      const json = await apiJson<{ data: { url: string } }>('/api/payments/stripe/subscription-checkout', {
        method: 'POST',
        body: JSON.stringify({
          tier: selectedPlan,
          ...(promoApplied ? { promotionCode: promoApplied.code } : {}),
        }),
      });
      window.location.href = json.data.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo iniciar Stripe.');
      setPayBusy(null);
    }
  };

  const startPayPal = async () => {
    if (!selectedPlan || selectedPlan === 'free') return;
    setPayBusy('paypal');
    try {
      const json = await apiJson<{ data: { approvalUrl: string } }>('/api/payments/paypal/create-subscription', {
        method: 'POST',
        body: JSON.stringify({ tier: selectedPlan }),
      });
      window.location.href = json.data.approvalUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo iniciar PayPal.');
      setPayBusy(null);
    }
  };

  const planForPayment = selectedPlan && selectedPlan !== 'free' ? plans.find((p) => p.id === selectedPlan) : undefined;
  const fromDailyPlan = searchParams.get('from') === 'daily-plan';

  return (
    <>
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
            <Crown className="h-8 w-8 text-warning" />
          </div>
          <DialogHeader className="sm:text-center">
            <DialogTitle className="text-xl">¡Felicitaciones!</DialogTitle>
            <DialogDescription className="text-base text-foreground/90">
              Tu suscripción está activa. Ya quedaste suscrito y tienes acceso completo a todo el contenido PRO.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button className="min-w-[140px]" onClick={() => setShowSuccessModal(false)}>
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showPayment && selectedPlan && planForPayment ? (
        <div className="max-w-lg mx-auto animate-fade-in">
          <Button variant="ghost" onClick={() => setShowPayment(false)} className="gap-2 mb-6" disabled={!!payBusy}>
            <ArrowLeft className="w-4 h-4" /> Volver a planes
          </Button>
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Completa tu pago</CardTitle>
              <p className="text-muted-foreground">
                Plan {planForPayment.name} — ${planForPayment.price.toLocaleString()} MXN {planForPayment.period}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="promo-code">Código promocional (opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="promo-code"
                    placeholder="Ej. ENARM2026"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      setPromoApplied(null);
                    }}
                    disabled={!!payBusy || promoBusy}
                    className="font-mono"
                    autoCapitalize="characters"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    disabled={!!payBusy || promoBusy || !promoInput.trim()}
                    onClick={() => void applyPromoCode()}
                  >
                    {promoBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aplicar'}
                  </Button>
                </div>
                {promoApplied && (
                  <p className="text-sm text-success">
                    Descuento del {promoApplied.percentOff}% en la primera factura; las renovaciones al precio del plan.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Si tienes código, aplícalo antes de pagar. Solo aplica a nuevas suscripciones con Stripe.
                </p>
              </div>
              <Button
                className="w-full h-14 text-base font-semibold gap-3 bg-[#635BFF] hover:bg-[#5851DB] text-white"
                onClick={() => void startStripe()}
                disabled={!!payBusy}
              >
                {payBusy === 'stripe' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                Suscribirse con Stripe
              </Button>
              {SHOW_PAYPAL_CHECKOUT && (
                <Button
                  className="w-full h-14 text-base font-semibold gap-3 bg-[#0070BA] hover:bg-[#005C99] text-white"
                  onClick={() => void startPayPal()}
                  disabled={!!payBusy}
                >
                  {payBusy === 'paypal' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.725 3.386.14 7.13-3.62 7.13h-2.19a1.627 1.627 0 0 0-1.604 1.373l-1.12 7.106a.641.641 0 0 0 .633.74h3.472c.457 0 .846-.334.917-.787l.378-2.398a.925.925 0 0 1 .913-.787h.601c3.728 0 6.643-1.515 7.497-5.896.36-1.846.148-3.372-.87-4.44z" />
                    </svg>
                  )}
                  Suscribirse con PayPal
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Cargo recurrente: el cobro se repetirá cada periodo hasta que canceles desde tu perfil.{' '}
                {SHOW_PAYPAL_CHECKOUT
                  ? 'Stripe y PayPal te redirigen de forma segura.'
                  : 'Stripe te redirige de forma segura.'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-warning" />
              <h1 className="text-3xl font-bold text-foreground">Elige tu plan</h1>
            </div>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Desbloquea acceso ilimitado a exámenes, estadísticas detalladas y todo el contenido de preparación ENARM.
              Cualquier plan de pago incluye el plan de hoy completo (bloque diario con preguntas, flashcards y mini-caso).
            </p>
            {!isFreeUser && (
              <Badge className="mt-3 bg-success/20 text-success border-success/30">
                Tu plan actual: {plans.find((p) => p.id === currentPlan)?.name}
              </Badge>
            )}
          </div>

          {fromDailyPlan && (
            <Alert className="max-w-2xl mx-auto border-primary/30 bg-primary/5">
              <Info className="h-4 w-4" />
              <AlertTitle>Plan de hoy completo</AlertTitle>
              <AlertDescription>
                No hay un plan distinto para esto: el bloque diario sin límites se activa con{' '}
                <strong>cualquiera</strong> de las suscripciones de abajo (Mensual, Semestral o Anual). Solo cambia el
                periodo de facturación y el precio.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`border-2 shadow-lg relative transition-all hover:shadow-xl ${
                  plan.popular ? 'border-primary scale-105' : 'border-border'
                } ${currentPlan === plan.id ? 'ring-2 ring-success' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="gradient-primary border-0 text-white px-4 py-1">🏆 Mejor valor</Badge>
                  </div>
                )}
                {plan.savings && (
                  <div className="absolute -top-3 right-4">
                    <Badge variant="secondary" className="bg-success/20 text-success border-success/30">
                      {plan.savings}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8 text-center space-y-4">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  <div>
                    <span className="text-4xl font-bold text-foreground">${plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                  {plan.id !== 'monthly' && <p className="text-sm text-muted-foreground">${plan.monthly} MXN/mes</p>}
                  <ul className="text-left space-y-2">
                    {paidPlanFeatureBullets.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-success flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full font-semibold ${plan.popular ? 'gradient-primary border-0' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={currentPlan === plan.id}
                  >
                    {currentPlan === plan.id ? 'Plan actual' : 'Seleccionar'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Subscription;
