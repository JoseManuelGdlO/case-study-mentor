import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

type PromoRow = {
  id: string;
  code: string;
  percentOff: number;
  maxRedemptions: number | null;
  validFrom: string | null;
  validUntil: string | null;
  isActive: boolean;
  timesRedeemed: number;
  createdAt: string;
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

const PromotionCodesManagement = () => {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState('10');
  const [newMax, setNewMax] = useState('');
  const [newValidFrom, setNewValidFrom] = useState('');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiJson<{ data: PromoRow[] }>('/api/backoffice/promotion-codes');
      setRows(json.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar códigos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createCode = async () => {
    const percentOff = Math.floor(Number(newPercent));
    if (!newCode.trim()) {
      toast.error('Ingresa un código');
      return;
    }
    if (!Number.isFinite(percentOff) || percentOff < 1 || percentOff > 100) {
      toast.error('El descuento debe ser entre 1 y 100%');
      return;
    }
    let maxRedemptions: number | null = null;
    if (newMax.trim()) {
      const m = Math.floor(Number(newMax));
      if (!Number.isFinite(m) || m < 1) {
        toast.error('Límite de usos inválido');
        return;
      }
      maxRedemptions = m;
    }
    setSaving(true);
    try {
      await apiJson('/api/backoffice/promotion-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode.trim(),
          percentOff,
          maxRedemptions,
          validFrom: newValidFrom ? new Date(newValidFrom).toISOString() : null,
          validUntil: newValidUntil ? new Date(newValidUntil).toISOString() : null,
        }),
      });
      toast.success('Código creado en Stripe');
      setDialogOpen(false);
      setNewCode('');
      setNewPercent('10');
      setNewMax('');
      setNewValidFrom('');
      setNewValidUntil('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const setActive = async (id: string, isActive: boolean) => {
    setTogglingId(id);
    try {
      await apiJson(`/api/backoffice/promotion-codes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
      toast.success(isActive ? 'Código activado' : 'Código desactivado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al actualizar');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Códigos de promoción</h1>
          <p className="text-muted-foreground">
            Descuento en la primera factura de la suscripción Stripe (renovaciones al precio completo).
          </p>
        </div>
        <Button className="gradient-primary border-0 gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Nuevo código
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo código promocional</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Código (visible para el usuario)</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="EJ: ENARM2026"
                autoCapitalize="characters"
              />
              <p className="text-xs text-muted-foreground">3–50 caracteres: letras, números, guiones.</p>
            </div>
            <div className="space-y-1">
              <Label>Descuento (%)</Label>
              <Input type="number" min={1} max={100} value={newPercent} onChange={(e) => setNewPercent(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Límite de usos (opcional)</Label>
              <Input
                type="number"
                min={1}
                placeholder="Ilimitado si se deja vacío"
                value={newMax}
                onChange={(e) => setNewMax(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Válido desde (opcional)</Label>
              <Input type="datetime-local" value={newValidFrom} onChange={(e) => setNewValidFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Válido hasta (opcional)</Label>
              <Input type="datetime-local" value={newValidUntil} onChange={(e) => setNewValidUntil(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button className="gradient-primary border-0" onClick={() => void createCode()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear en Stripe'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Usos contabilizados según Stripe.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">No hay códigos. Crea uno para ofrecer descuentos en el primer cobro.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Vigencia</TableHead>
                    <TableHead>Activo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.code}</TableCell>
                      <TableCell>{r.percentOff}%</TableCell>
                      <TableCell>
                        {r.timesRedeemed}
                        {r.maxRedemptions != null ? ` / ${r.maxRedemptions}` : ''}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {r.validFrom || r.validUntil ? (
                          <>
                            {formatDate(r.validFrom)}
                            {' → '}
                            {formatDate(r.validUntil)}
                          </>
                        ) : (
                          'Sin límite de fechas en app'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={r.isActive}
                            disabled={togglingId === r.id}
                            onCheckedChange={(v) => void setActive(r.id, v)}
                          />
                          {!r.isActive && <Badge variant="secondary">Off</Badge>}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromotionCodesManagement;
