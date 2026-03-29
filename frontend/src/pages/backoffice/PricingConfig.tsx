import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Eye, Crown } from 'lucide-react';
import { mockPlanConfigs, type PlanConfig } from '@/data/backofficeData';
import { useToast } from '@/hooks/use-toast';

const PricingConfig = () => {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanConfig[]>(mockPlanConfigs);
  const [showPreview, setShowPreview] = useState(false);

  const updatePlan = (id: string, field: keyof PlanConfig, value: string | number) => {
    setPlans((prev) => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = () => {
    toast({ title: 'Precios guardados', description: 'Los precios de suscripción han sido actualizados exitosamente.' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración de Precios</h1>
          <p className="text-muted-foreground">Administra los planes de suscripción</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
            <Eye className="w-4 h-4" /> {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
          </Button>
          <Button className="gradient-primary border-0 gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" /> Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>Configuración del plan {plan.name.toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nombre del plan</label>
                <Input value={plan.name} onChange={(e) => updatePlan(plan.id, 'name', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Precio (MXN)</label>
                <Input type="number" value={plan.price} onChange={(e) => updatePlan(plan.id, 'price', Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Periodo</label>
                <Input value={plan.period} onChange={(e) => updatePlan(plan.id, 'period', e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Descripción</label>
                <Input value={plan.description} onChange={(e) => updatePlan(plan.id, 'description', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showPreview && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Preview — Así lo verán los usuarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan, i) => (
                <Card key={plan.id} className={`relative ${i === 2 ? 'ring-2 ring-primary' : ''}`}>
                  {i === 2 && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary border-0 gap-1">
                      <Crown className="w-3 h-3" /> Mejor valor
                    </Badge>
                  )}
                  <CardContent className="p-6 text-center space-y-3">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div>
                      <span className="text-3xl font-bold text-gradient">${plan.price.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm"> MXN / {plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                    <Button className="w-full gradient-primary border-0">Suscribirme</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PricingConfig;
