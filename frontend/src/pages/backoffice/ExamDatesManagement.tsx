import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, CalendarClock, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

type ExamDateRow = {
  id: string;
  name: string;
  date: string;
  isActive: boolean;
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ExamDatesManagement = () => {
  const [dates, setDates] = useState<ExamDateRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExamDateRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      const json = await apiJson<{ data: ExamDateRow[]; totalPages: number }>(`/api/backoffice/exam-dates?${qs}`);
      setDates(json.data);
      setTotalPages(Math.max(1, json.totalPages));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar fechas');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setFormName('');
    setFormDate('');
    setDialogOpen(true);
  };

  const openEdit = (d: ExamDateRow) => {
    setEditing(d);
    setFormName(d.name);
    setFormDate(toDatetimeLocalValue(d.date));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formDate) return;
    const iso = new Date(formDate).toISOString();
    try {
      if (editing) {
        await apiJson(`/api/backoffice/exam-dates/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: formName.trim(), date: iso }),
        });
        toast.success('Fecha actualizada');
      } else {
        await apiJson('/api/backoffice/exam-dates', {
          method: 'POST',
          body: JSON.stringify({ name: formName.trim(), date: iso, isActive: true }),
        });
        toast.success('Fecha agregada');
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const toggleActive = async (d: ExamDateRow) => {
    try {
      await apiJson(`/api/backoffice/exam-dates/${d.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !d.isActive }),
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const deleteDate = async (id: string) => {
    if (!confirm('¿Eliminar esta fecha?')) return;
    try {
      await apiJson(`/api/backoffice/exam-dates/${id}`, { method: 'DELETE' });
      toast.success('Fecha eliminada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" /> Fechas de Examen
          </h1>
          <p className="text-muted-foreground">Calendario ENARM (nombre, fecha y si está activa para la app)</p>
        </div>
        <Button className="gradient-primary border-0 gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> Nueva Fecha
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Fecha' : 'Nueva Fecha de Examen'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input placeholder="Ej: ENARM 2026" value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha y hora *</Label>
              <Input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="gradient-primary border-0" onClick={handleSave} disabled={!formName.trim() || !formDate}>
              {editing ? 'Guardar Cambios' : 'Agregar Fecha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Activa</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dates.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.name}{' '}
                      {d.isActive && (
                        <Badge className="ml-2 gradient-primary border-0 text-xs">Activa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(d.date).toLocaleString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={d.isActive} onCheckedChange={() => toggleActive(d)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(d)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteDate(d.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
};

export default ExamDatesManagement;
