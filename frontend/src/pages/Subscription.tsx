import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, type UserPlan } from '@/contexts/UserContext';
import { Check, Crown, CreditCard, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const plans: { id: UserPlan; name: string; price: number; period: string; monthly: number; savings?: string; popular?: boolean }[] = [
  { id: 'monthly', name: 'Mensual', price: 200, period: '/mes', monthly: 200 },
  { id: 'semester', name: 'Semestral', price: 1000, period: '/6 meses', monthly: 167, savings: 'Ahorra $200' },
  { id: 'annual', name: 'Anual', price: 2100, period: '/año', monthly: 175, savings: 'Ahorra $300', popular: true },
];

const Subscription = () => {
  const navigate = useNavigate();
  const { plan: currentPlan, setPlan, isFreeUser } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const handleSelectPlan = (planId: UserPlan) => {
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePay = (method: 'stripe' | 'paypal') => {
    if (selectedPlan) {
      setPlan(selectedPlan);
      toast.success(`¡Suscripción ${plans.find(p => p.id === selectedPlan)?.name} activada con éxito!`, {
        description: 'Ahora tienes acceso completo a la plataforma.',
      });
      navigate('/dashboard');
    }
  };

  if (showPayment && selectedPlan) {
    const plan = plans.find(p => p.id === selectedPlan)!;
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <Button variant="ghost" onClick={() => setShowPayment(false)} className="gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver a planes
        </Button>
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Completa tu pago</CardTitle>
            <p className="text-muted-foreground">Plan {plan.name} — ${plan.price.toLocaleString()} MXN {plan.period}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-14 text-base font-semibold gap-3 bg-[#635BFF] hover:bg-[#5851DB] text-white"
              onClick={() => handlePay('stripe')}
            >
              <CreditCard className="w-5 h-5" />
              Pagar con Stripe
            </Button>
            <Button
              className="w-full h-14 text-base font-semibold gap-3 bg-[#0070BA] hover:bg-[#005C99] text-white"
              onClick={() => handlePay('paypal')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.725 3.386.14 7.13-3.62 7.13h-2.19a1.627 1.627 0 0 0-1.604 1.373l-1.12 7.106a.641.641 0 0 0 .633.74h3.472c.457 0 .846-.334.917-.787l.378-2.398a.925.925 0 0 1 .913-.787h.601c3.728 0 6.643-1.515 7.497-5.896.36-1.846.148-3.372-.87-4.44z" /></svg>
              Pagar con PayPal
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Este es un entorno de demostración. No se realizará ningún cobro real.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Crown className="w-8 h-8 text-warning" />
          <h1 className="text-3xl font-bold text-foreground">Elige tu plan</h1>
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Desbloquea acceso ilimitado a exámenes, estadísticas detalladas y todo el contenido de preparación ENARM.
        </p>
        {!isFreeUser && (
          <Badge className="mt-3 bg-success/20 text-success border-success/30">
            Tu plan actual: {plans.find(p => p.id === currentPlan)?.name}
          </Badge>
        )}
      </div>

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
                <Badge variant="secondary" className="bg-success/20 text-success border-success/30">{plan.savings}</Badge>
              </div>
            )}
            <CardContent className="p-6 pt-8 text-center space-y-4">
              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <div>
                <span className="text-4xl font-bold text-foreground">${plan.price.toLocaleString()}</span>
                <span className="text-muted-foreground ml-1">{plan.period}</span>
              </div>
              {plan.id !== 'monthly' && (
                <p className="text-sm text-muted-foreground">${plan.monthly} MXN/mes</p>
              )}
              <ul className="text-left space-y-2">
                {[
                  'Exámenes ilimitados',
                  'Todas las preguntas',
                  'Estadísticas completas',
                  'Explicaciones detalladas',
                  'Bibliografía incluida',
                ].map((feature) => (
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
  );
};


export default Subscription;
