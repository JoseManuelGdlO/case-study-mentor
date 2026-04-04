import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react';
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

/** Valor para input datetime-local en hora local. */
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const PromotionCodesManagement = () => {
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState('10');
  const [newMax, setNewMax] = useState('');
  const [newValidFrom, setNewValidFrom] = useState('');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreateDialog = () => {
    setDialogMode('create');
    setEditId(null);
    setNewCode('');
    setNewPercent('10');
    setNewMax('');
    setNewValidFrom('');
    setNewValidUntil('');
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (r: PromoRow) => {
    setDialogMode('edit');
    setEditId(r.id);
    setNewCode(r.code);
    setNewPercent(String(r.percentOff));
    setNewMax(r.maxRedemptions != null ? String(r.maxRedemptions) : '');
    setNewValidFrom(toDatetimeLocalValue(r.validFrom));
    setNewValidUntil(toDatetimeLocalValue(r.validUntil));
    setFormIsActive(r.isActive);
    setDialogOpen(true);
  };

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

  const buildPayload = () => {
    const percentOff = Math.floor(Number(newPercent));
    if (!newCode.trim()) {
      toast.error('Ingresa un código');
      return null;
    }
    if (!Number.isFinite(percentOff) || percentOff < 1 || percentOff > 100) {
      toast.error('El descuento debe ser entre 1 y 100%');
      return null;
    }
    let maxRedemptions: number | null = null;
    if (newMax.trim()) {
      const m = Math.floor(Number(newMax));
      if (!Number.isFinite(m) || m < 1) {
        toast.error('Límite de usos inválido');
        return null;
      }
      maxRedemptions = m;
    }
    return {
      code: newCode.trim(),
      percentOff,
      maxRedemptions,
      validFrom: newValidFrom ? new Date(newValidFrom).toISOString() : null,
      validUntil: newValidUntil ? new Date(newValidUntil).toISOString() : null,
    };
  };

  const saveDialog = async () => {
    const payload = buildPayload();
    if (!payload) return;
    setSaving(true);
    try {
      if (dialogMode === 'create') {
        await apiJson('/api/backoffice/promotion-codes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Código creado en Stripe');
      } else if (editId) {
        await apiJson(`/api/backoffice/promotion-codes/${editId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, isActive: formIsActive }),
        });
        toast.success('Código actualizado');
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : dialogMode === 'create' ? 'Error al crear' : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const deleteCode = async (id: string, code: string) => {
    if (!confirm(`¿Eliminar el código "${code}"? Se desactivará en Stripe y se borrará del listado.`)) return;
    setDeletingId(id);
    try {
      await apiJson(`/api/backoffice/promotion-codes/${id}`, { method: 'DELETE' });
      toast.success('Código eliminado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setDeletingId(null);
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
        <Button className="gradient-primary border-0 gap-2" onClick={openCreateDialog}>
          <Plus className="w-4 h-4" /> Nuevo código
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? 'Nuevo código promocional' : 'Editar código promocional'}
            </DialogTitle>
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
            {dialogMode === 'edit' && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>Activo</Label>
                  <p className="text-xs text-muted-foreground">Sincronizado con Stripe</p>
                </div>
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} disabled={saving} />
              </div>
            )}
            {dialogMode === 'edit' && (
              <p className="text-xs text-muted-foreground">
                Si cambias el texto del código, el porcentaje, el límite de usos o la vigencia final, se generan nuevos
                objetos en Stripe y se desactivan los anteriores.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button className="gradient-primary border-0" onClick={() => void saveDialog()} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : dialogMode === 'create' ? (
                'Crear en Stripe'
              ) : (
                'Guardar'
              )}
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
                    <TableHead className="w-[140px] text-right">Acciones</TableHead>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            title="Editar"
                            onClick={() => openEditDialog(r)}
                            disabled={!!deletingId}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            title="Eliminar"
                            disabled={deletingId === r.id}
                            onClick={() => void deleteCode(r.id, r.code)}
                          >
                            {deletingId === r.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
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
