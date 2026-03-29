import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit, CalendarClock, Star } from 'lucide-react';
import { mockExamDates, type ExamDate } from '@/data/examDatesData';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const ExamDatesManagement = () => {
  const { toast } = useToast();
  const [dates, setDates] = useState<ExamDate[]>(mockExamDates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ExamDate | null>(null);
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const openNew = () => { setEditing(null); setFormName(''); setFormDate(''); setFormDesc(''); setDialogOpen(true); };
  const openEdit = (d: ExamDate) => {
    setEditing(d);
    setFormName(d.name);
    setFormDate(d.date.slice(0, 16));
    setFormDesc(d.description);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim() || !formDate) return;
    if (editing) {
      setDates((prev) => prev.map((d) => d.id === editing.id ? { ...d, name: formName.trim(), date: formDate, description: formDesc.trim() } : d));
      toast({ title: 'Fecha actualizada' });
    } else {
      setDates((prev) => [...prev, { id: `ed-${Date.now()}`, name: formName.trim(), date: formDate, description: formDesc.trim(), isActive: false }]);
      toast({ title: 'Fecha de examen agregada' });
    }
    setDialogOpen(false);
  };

  const setActive = (id: string) => {
    setDates((prev) => prev.map((d) => ({ ...d, isActive: d.id === id })));
    toast({ title: 'Examen activo actualizado', description: 'Este examen se mostrará en el contador del dashboard.' });
  };

  const deleteDate = (id: string) => {
    setDates((prev) => prev.filter((d) => d.id !== id));
    toast({ title: 'Fecha eliminada' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" /> Fechas de Examen
          </h1>
          <p className="text-muted-foreground">Administra las fechas del ENARM. La fecha activa se muestra como contador en el dashboard.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0 gap-2" onClick={openNew}><Plus className="w-4 h-4" /> Nueva Fecha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Fecha' : 'Nueva Fecha de Examen'}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Ej: ENARM 2026" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Fecha y hora *</Label>
                <Input type="datetime-local" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Input placeholder="Descripción opcional..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="gradient-primary border-0" onClick={handleSave} disabled={!formName.trim() || !formDate}>
                {editing ? 'Guardar Cambios' : 'Agregar Fecha'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="text-center">En Dashboard</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    {d.name} {d.isActive && <Badge className="ml-2 gradient-primary border-0 text-xs">Activo</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(d.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{d.description || '—'}</TableCell>
                  <TableCell className="text-center">
                    <Button size="sm" variant={d.isActive ? 'default' : 'outline'} onClick={() => setActive(d.id)} className={d.isActive ? 'gradient-primary border-0' : ''}>
                      <Star className={`w-4 h-4 ${d.isActive ? 'fill-current' : ''}`} />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Edit className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteDate(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamDatesManagement;
