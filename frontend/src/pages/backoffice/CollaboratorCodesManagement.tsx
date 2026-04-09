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

type CollaboratorRow = {
  id: string;
  code: string;
  displayName: string;
  promotionCodeId: string | null;
  percentOff: number | null;
  isActive: boolean;
  signupCount: number;
  createdAt: string;
  updatedAt: string;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

const CollaboratorCodesManagement = () => {
  const [rows, setRows] = useState<CollaboratorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [attributionOnly, setAttributionOnly] = useState(true);
  const [newPercent, setNewPercent] = useState('10');
  const [newMax, setNewMax] = useState('');
  const [newValidFrom, setNewValidFrom] = useState('');
  const [newValidUntil, setNewValidUntil] = useState('');
  const [editNameId, setEditNameId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiJson<{ data: CollaboratorRow[] }>('/api/backoffice/collaborator-codes');
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

  const openCreateDialog = () => {
    setNewCode('');
    setNewDisplayName('');
    setAttributionOnly(true);
    setNewPercent('10');
    setNewMax('');
    setNewValidFrom('');
    setNewValidUntil('');
    setDialogOpen(true);
  };

  const saveCreate = async () => {
    if (!newCode.trim() || !newDisplayName.trim()) {
      toast.error('Código y nombre del colaborador son obligatorios');
      return;
    }
    if (!attributionOnly) {
      const p = Math.floor(Number(newPercent));
      if (!Number.isFinite(p) || p < 1 || p > 100) {
        toast.error('El descuento debe ser entre 1 y 100%');
        return;
      }
    }
    let maxRedemptions: number | null = null;
    if (!attributionOnly && newMax.trim()) {
      const m = Math.floor(Number(newMax));
      if (!Number.isFinite(m) || m < 1) {
        toast.error('Límite de usos inválido');
        return;
      }
      maxRedemptions = m;
    }
    setSaving(true);
    try {
      await apiJson('/api/backoffice/collaborator-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: newCode.trim(),
          displayName: newDisplayName.trim(),
          attributionOnly,
          ...(!attributionOnly
            ? {
                percentOff: Math.floor(Number(newPercent)),
                maxRedemptions,
                validFrom: newValidFrom ? new Date(newValidFrom).toISOString() : null,
                validUntil: newValidUntil ? new Date(newValidUntil).toISOString() : null,
              }
            : {}),
        }),
      });
      toast.success(attributionOnly ? 'Código de colaborador creado' : 'Código creado con descuento en Stripe');
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear');
    } finally {
      setSaving(false);
    }
  };

  const openEditName = (r: CollaboratorRow) => {
    setEditNameId(r.id);
    setEditNameValue(r.displayName);
    setNameDialogOpen(true);
  };

  const saveDisplayName = async () => {
    if (!editNameId || !editNameValue.trim()) return;
    setSaving(true);
    try {
      await apiJson(`/api/backoffice/collaborator-codes/${editNameId}`, {
        method: 'PUT',
        body: JSON.stringify({ displayName: editNameValue.trim() }),
      });
      toast.success('Nombre actualizado');
      setNameDialogOpen(false);
      setEditNameId(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const deleteCode = async (id: string, code: string) => {
    if (
      !confirm(
        `¿Eliminar el código "${code}"? Si tenía descuento Stripe, también se eliminará el cupón asociado.`
      )
    )
      return;
    setDeletingId(id);
    try {
      await apiJson(`/api/backoffice/collaborator-codes/${id}`, { method: 'DELETE' });
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
      await apiJson(`/api/backoffice/collaborator-codes/${id}`, {
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
          <h1 className="text-2xl font-bold text-foreground">Códigos de colaborador</h1>
          <p className="text-muted-foreground">
            Atribución de inscripciones y, opcionalmente, descuento en el primer cobro (Stripe). El conteo de inscripciones
            es local.
          </p>
        </div>
        <Button className="gradient-primary border-0 gap-2" onClick={openCreateDialog}>
          <Plus className="w-4 h-4" /> Nuevo código
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo código de colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre visible (colaborador)</Label>
              <Input
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                placeholder="Ej. Dra. López"
              />
            </div>
            <div className="space-y-1">
              <Label>Código (lo escribe el usuario al pagar)</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="EJ: MARIA2026"
                autoCapitalize="characters"
              />
              <p className="text-xs text-muted-foreground">3–50 caracteres: letras, números, guiones.</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Solo atribución (sin descuento)</Label>
                <p className="text-xs text-muted-foreground">No se crea cupón en Stripe</p>
              </div>
              <Switch checked={attributionOnly} onCheckedChange={setAttributionOnly} disabled={saving} />
            </div>
            {!attributionOnly && (
              <>
                <div className="space-y-1">
                  <Label>Descuento (%)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={newPercent}
                    onChange={(e) => setNewPercent(e.target.value)}
                  />
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
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button className="gradient-primary border-0" onClick={() => void saveCreate()} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={nameDialogOpen}
        onOpenChange={(o) => {
          setNameDialogOpen(o);
          if (!o) setEditNameId(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar nombre del colaborador</DialogTitle>
          </DialogHeader>
          <Input value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNameDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void saveDisplayName()} disabled={saving}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>Inscripciones = usuarios con este código guardado al suscribirse (primera vez).</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">No hay códigos de colaborador.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Inscripciones</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Activo</TableHead>
                    <TableHead className="w-[140px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono font-medium">{r.code}</TableCell>
                      <TableCell>{r.displayName}</TableCell>
                      <TableCell>
                        {r.percentOff != null ? (
                          <span>{r.percentOff}%</span>
                        ) : (
                          <Badge variant="secondary">Solo atribución</Badge>
                        )}
                      </TableCell>
                      <TableCell>{r.signupCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(r.createdAt)}</TableCell>
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
                            title="Editar nombre"
                            onClick={() => openEditName(r)}
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

export default CollaboratorCodesManagement;
