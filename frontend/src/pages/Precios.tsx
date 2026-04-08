import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  freePlanBullets,
  freePlanDescription,
  freePlanTitle,
  paidPlanFeatureBullets,
  subscriptionPricingPlans,
} from '@/constants/pricingPlans';
import { Seo } from '@/components/Seo';

export default function Precios() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <Seo
        title="Planes y precios — suscripción ENARM en MXN"
        description="Planes ENARMX en pesos mexicanos: empieza gratis y sube de nivel cuando quieras. Simulacros, estadísticas y preparación para la residencia médica."
        path="/precios"
        socialTitle="Planes y precios ENARMX"
      />
      <div className="container max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" asChild>
          <Link to="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </Button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Crown className="w-8 h-8 text-warning" />
            <h1 className="text-3xl font-bold text-foreground">Planes en pesos mexicanos — empieza gratis</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Montos en MXN. Suscripción recurrente hasta que canceles desde tu perfil — sin letras pequeñas, sin sorpresas
            en el cargo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-2 border-border shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="w-5 h-5" />
                <CardTitle className="text-lg">{freePlanTitle}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground text-left font-normal">{freePlanDescription}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-3xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground ml-1">MXN</span>
              </div>
              <ul className="text-left space-y-2">
                {freePlanBullets.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/login">Entrenar gratis ahora</Link>
              </Button>
            </CardContent>
          </Card>

          {subscriptionPricingPlans.map((plan) => (
            <Card
              key={plan.id}
              className={`border-2 shadow-lg relative transition-all hover:shadow-xl ${
                plan.popular ? 'border-primary scale-[1.02] lg:scale-105' : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="gradient-primary border-0 text-white px-4 py-1">🏆 Mejor valor</Badge>
                </div>
              )}
              {plan.savings && (
                <div className="absolute -top-3 right-2 z-10">
                  <Badge variant="secondary" className="bg-success/20 text-success border-success/30 text-xs">
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
                <Button className={`w-full font-semibold ${plan.popular ? 'gradient-primary border-0' : ''}`} asChild>
                  <Link to="/login">Quiero este plan</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline underline-offset-2">
            Inicia sesión
          </Link>{' '}
          y elige tu plan en Suscripción.
        </p>
      </div>
    </div>
  );
}
