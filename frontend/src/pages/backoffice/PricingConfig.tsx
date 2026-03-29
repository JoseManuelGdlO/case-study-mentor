import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Save, Eye, Crown, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

type PlanRow = {
  id: string;
  name: string;
  price: number;
  duration: number;
  features: string;
  isActive: boolean;
  highlighted: boolean;
};

const PricingConfig = () => {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('0');
  const [newDuration, setNewDuration] = useState('30');
  const [newFeatures, setNewFeatures] = useState('');
  const limit = 12;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      const json = await apiJson<{ data: PlanRow[]; totalPages: number }>(`/api/backoffice/pricing?${qs}`);
      setPlans(json.data);
      setTotalPages(Math.max(1, json.totalPages));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar planes');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const updatePlan = (id: string, patch: Partial<PlanRow>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const savePlan = async (plan: PlanRow) => {
    try {
      await apiJson(`/api/backoffice/pricing/${plan.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: plan.name,
          price: plan.price,
          duration: plan.duration,
          features: plan.features,
          isActive: plan.isActive,
          highlighted: plan.highlighted,
        }),
      });
      toast.success('Plan guardado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm('¿Eliminar este plan?')) return;
    try {
      await apiJson(`/api/backoffice/pricing/${id}`, { method: 'DELETE' });
      toast.success('Plan eliminado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const createPlan = async () => {
    const price = Number(newPrice);
    const duration = Math.max(1, Math.floor(Number(newDuration)));
    if (!newName.trim() || Number.isNaN(price) || Number.isNaN(duration)) {
      toast.error('Completa nombre, precio y duración válidos');
      return;
    }
    try {
      await apiJson('/api/backoffice/pricing', {
        method: 'POST',
        body: JSON.stringify({
          name: newName.trim(),
          price,
          duration,
          features: newFeatures.trim() || '—',
          isActive: true,
          highlighted: false,
        }),
      });
      toast.success('Plan creado');
      setDialogOpen(false);
      setNewName('');
      setNewPrice('0');
      setNewDuration('30');
      setNewFeatures('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const activePlans = plans.filter((p) => p.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración de Precios</h1>
          <p className="text-muted-foreground">Planes de suscripción en base de datos</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
            <Eye className="w-4 h-4" /> {showPreview ? 'Ocultar Preview' : 'Ver Preview'}
          </Button>
          <Button className="gradient-primary border-0 gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4" /> Nuevo plan
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Precio (MXN)</Label>
              <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Duración (días)</Label>
              <Input type="number" min={1} value={newDuration} onChange={(e) => setNewDuration(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Características (texto)</Label>
              <Textarea value={newFeatures} onChange={(e) => setNewFeatures(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="gradient-primary border-0" onClick={createPlan}>
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>Duración: {plan.duration} días</CardDescription>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => deletePlan(plan.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Nombre</label>
                  <Input value={plan.name} onChange={(e) => updatePlan(plan.id, { name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Precio (MXN)</label>
                  <Input
                    type="number"
                    value={plan.price}
                    onChange={(e) => updatePlan(plan.id, { price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Duración (días)</label>
                  <Input
                    type="number"
                    min={1}
                    value={plan.duration}
                    onChange={(e) => updatePlan(plan.id, { duration: Math.max(1, Math.floor(Number(e.target.value))) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Características</label>
                  <Textarea
                    value={plan.features}
                    onChange={(e) => updatePlan(plan.id, { features: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Activo</Label>
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={(v) => updatePlan(plan.id, { isActive: v })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Destacado</Label>
                  <Switch
                    checked={plan.highlighted}
                    onCheckedChange={(v) => updatePlan(plan.id, { highlighted: v })}
                  />
                </div>
                <Button className="w-full gradient-primary border-0 gap-2" onClick={() => savePlan(plan)}>
                  <Save className="w-4 h-4" /> Guardar
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((x) => x - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((x) => x + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {showPreview && activePlans.length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Preview — planes activos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {activePlans.map((plan) => (
                <Card key={plan.id} className={`relative ${plan.highlighted ? 'ring-2 ring-primary' : ''}`}>
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-primary border-0 gap-1">
                      <Crown className="w-3 h-3" /> Destacado
                    </Badge>
                  )}
                  <CardContent className="p-6 text-center space-y-3">
                    <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                    <div>
                      <span className="text-3xl font-bold text-gradient">${plan.price.toLocaleString()}</span>
                      <span className="text-muted-foreground text-sm"> MXN / {plan.duration} días</span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.features}</p>
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
