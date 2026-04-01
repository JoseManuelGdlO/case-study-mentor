import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import type { Category } from '@/types';

type FlashcardRow = {
  id: string;
  question: string;
  answer: string;
  hint?: string | null;
  isActive: boolean;
  specialtyIds: string[];
  areaIds: string[];
  updatedAt: string;
};

const FlashcardsManagement = () => {
  const [rows, setRows] = useState<FlashcardRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FlashcardRow | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [hint, setHint] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [specialtyIds, setSpecialtyIds] = useState<string[]>([]);
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const limit = 20;

  const allAreas = useMemo(
    () => categories.filter((c) => specialtyIds.includes(c.id)).flatMap((c) => c.subcategories),
    [categories, specialtyIds]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [flashJson, specsJson] = await Promise.all([
        apiJson<{ data: FlashcardRow[]; totalPages: number }>(
          `/api/backoffice/flashcards?page=${page}&limit=${limit}`
        ),
        apiJson<{ data: Category[] }>('/api/specialties'),
      ]);
      setRows(flashJson.data);
      setTotalPages(Math.max(1, flashJson.totalPages));
      setCategories(specsJson.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar flashcards');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditing(null);
    setQuestion('');
    setAnswer('');
    setHint('');
    setIsActive(true);
    setSpecialtyIds([]);
    setAreaIds([]);
  };

  const openNew = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (row: FlashcardRow) => {
    setEditing(row);
    setQuestion(row.question);
    setAnswer(row.answer);
    setHint(row.hint ?? '');
    setIsActive(row.isActive);
    setSpecialtyIds(row.specialtyIds);
    setAreaIds(row.areaIds);
    setDialogOpen(true);
  };

  const toggleSpecialty = (id: string) => {
    setSpecialtyIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      const validAreaIds = new Set(
        categories.filter((c) => next.includes(c.id)).flatMap((c) => c.subcategories.map((s) => s.id))
      );
      setAreaIds((areas) => areas.filter((a) => validAreaIds.has(a)));
      return next;
    });
  };

  const toggleArea = (id: string) => {
    setAreaIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const save = async () => {
    if (!question.trim() || !answer.trim()) {
      toast.error('Pregunta y respuesta son obligatorias');
      return;
    }
    const payload = {
      question: question.trim(),
      answer: answer.trim(),
      hint: hint.trim() || undefined,
      isActive,
      specialtyIds,
      areaIds,
    };
    try {
      if (editing) {
        await apiJson(`/api/backoffice/flashcards/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Flashcard actualizada');
      } else {
        await apiJson('/api/backoffice/flashcards', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Flashcard creada');
      }
      setDialogOpen(false);
      resetForm();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar esta flashcard?')) return;
    try {
      await apiJson(`/api/backoffice/flashcards/${id}`, { method: 'DELETE' });
      toast.success('Flashcard eliminada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    }
  };

  const toggleActive = async (row: FlashcardRow) => {
    try {
      await apiJson(`/api/backoffice/flashcards/${row.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Flashcards
          </h1>
          <p className="text-muted-foreground">Gestiona tarjetas para el plan diario del estudiante</p>
        </div>
        <Button className="gradient-primary border-0 gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> Nueva Flashcard
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Flashcard' : 'Nueva Flashcard'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pregunta *</Label>
              <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Respuesta *</Label>
              <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Pista (opcional)</Label>
              <Input value={hint} onChange={(e) => setHint(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Especialidades</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3 max-h-40 overflow-auto">
                {categories.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={specialtyIds.includes(c.id)} onCheckedChange={() => toggleSpecialty(c.id)} />
                    {c.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Areas</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border p-3 max-h-40 overflow-auto">
                {allAreas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Selecciona una especialidad para listar areas.</p>
                ) : (
                  allAreas.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox checked={areaIds.includes(a.id)} onCheckedChange={() => toggleArea(a.id)} />
                      {a.name}
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label>Activa</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button className="gradient-primary border-0" onClick={save}>
              {editing ? 'Guardar cambios' : 'Crear flashcard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pregunta</TableHead>
                  <TableHead>Especialidades</TableHead>
                  <TableHead>Actualizada</TableHead>
                  <TableHead className="text-center">Activa</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-[420px] truncate">{r.question}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.specialtyIds.length}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.updatedAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={r.isActive} onCheckedChange={() => void toggleActive(r)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => void remove(r.id)}>
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

export default FlashcardsManagement;
