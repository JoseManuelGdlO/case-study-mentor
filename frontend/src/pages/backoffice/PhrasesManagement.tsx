import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Sparkles, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

type PhraseRow = {
  id: string;
  text: string;
  author: string;
  isActive: boolean;
  createdAt: string;
};

const PhrasesManagement = () => {
  const [phrases, setPhrases] = useState<PhraseRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<PhraseRow | null>(null);
  const [formText, setFormText] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      const json = await apiJson<{
        data: PhraseRow[];
        totalPages: number;
      }>(`/api/backoffice/phrases?${qs}`);
      setPhrases(json.data);
      setTotalPages(Math.max(1, json.totalPages));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar frases');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditingPhrase(null);
    setFormText('');
    setFormAuthor('');
    setDialogOpen(true);
  };

  const openEdit = (p: PhraseRow) => {
    setEditingPhrase(p);
    setFormText(p.text);
    setFormAuthor(p.author || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formText.trim()) return;
    const author = formAuthor.trim() || 'Anónimo';
    try {
      if (editingPhrase) {
        await apiJson(`/api/backoffice/phrases/${editingPhrase.id}`, {
          method: 'PUT',
          body: JSON.stringify({ text: formText.trim(), author }),
        });
        toast.success('Frase actualizada');
      } else {
        await apiJson('/api/backoffice/phrases', {
          method: 'POST',
          body: JSON.stringify({ text: formText.trim(), author, isActive: true }),
        });
        toast.success('Frase agregada');
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const toggleActive = async (p: PhraseRow) => {
    try {
      await apiJson(`/api/backoffice/phrases/${p.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const deletePhrase = async (id: string) => {
    if (!confirm('¿Eliminar esta frase?')) return;
    try {
      await apiJson(`/api/backoffice/phrases/${id}`, { method: 'DELETE' });
      toast.success('Frase eliminada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const activeCount = phrases.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Frases Motivacionales
          </h1>
          <p className="text-muted-foreground">
            {loading ? 'Cargando…' : `${activeCount} activas en esta página de ${phrases.length} filas`}
          </p>
        </div>
        <Button className="gradient-primary border-0 gap-2" onClick={openNew}>
          <Plus className="w-4 h-4" /> Nueva Frase
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPhrase ? 'Editar Frase' : 'Nueva Frase Motivacional'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Frase *</Label>
              <Textarea
                placeholder="Escribe una frase motivacional para los estudiantes..."
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Autor</Label>
              <Input
                placeholder="Si queda vacío se usará «Anónimo»"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button className="gradient-primary border-0" onClick={handleSave} disabled={!formText.trim()}>
              {editingPhrase ? 'Guardar Cambios' : 'Agregar Frase'}
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
                  <TableHead className="w-[50%]">Frase</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Activa</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phrases.map((p) => (
                  <TableRow key={p.id} className={!p.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <Quote className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{p.text}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.author || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.createdAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch checked={p.isActive} onCheckedChange={() => toggleActive(p)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deletePhrase(p.id)}>
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

export default PhrasesManagement;
