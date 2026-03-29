import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Sparkles, Quote } from 'lucide-react';
import { mockPhrases, type MotivationalPhrase } from '@/data/phrasesData';
import { useToast } from '@/hooks/use-toast';

const PhrasesManagement = () => {
  const { toast } = useToast();
  const [phrases, setPhrases] = useState<MotivationalPhrase[]>(mockPhrases);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<MotivationalPhrase | null>(null);
  const [formText, setFormText] = useState('');
  const [formAuthor, setFormAuthor] = useState('');

  const openNew = () => {
    setEditingPhrase(null);
    setFormText('');
    setFormAuthor('');
    setDialogOpen(true);
  };

  const openEdit = (p: MotivationalPhrase) => {
    setEditingPhrase(p);
    setFormText(p.text);
    setFormAuthor(p.author || '');
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formText.trim()) return;
    if (editingPhrase) {
      setPhrases((prev) =>
        prev.map((p) => p.id === editingPhrase.id ? { ...p, text: formText.trim(), author: formAuthor.trim() || undefined } : p)
      );
      toast({ title: 'Frase actualizada' });
    } else {
      const newPhrase: MotivationalPhrase = {
        id: `p-${Date.now()}`,
        text: formText.trim(),
        author: formAuthor.trim() || undefined,
        isActive: true,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setPhrases((prev) => [newPhrase, ...prev]);
      toast({ title: 'Frase agregada' });
    }
    setDialogOpen(false);
  };

  const toggleActive = (id: string) => {
    setPhrases((prev) => prev.map((p) => p.id === id ? { ...p, isActive: !p.isActive } : p));
  };

  const deletePhrase = (id: string) => {
    setPhrases((prev) => prev.filter((p) => p.id !== id));
    toast({ title: 'Frase eliminada' });
  };

  const activeCount = phrases.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" /> Frases Motivacionales
          </h1>
          <p className="text-muted-foreground">
            {activeCount} frases activas de {phrases.length} totales — se muestran a los usuarios de forma rotativa
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary border-0 gap-2" onClick={openNew}>
              <Plus className="w-4 h-4" /> Nueva Frase
            </Button>
          </DialogTrigger>
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
                <Label>Autor (opcional)</Label>
                <Input
                  placeholder="Ej: Albert Einstein, ENARM Prep..."
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button className="gradient-primary border-0" onClick={handleSave} disabled={!formText.trim()}>
                {editingPhrase ? 'Guardar Cambios' : 'Agregar Frase'}
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
                  <TableCell className="text-sm text-muted-foreground">{p.createdAt}</TableCell>
                  <TableCell className="text-center">
                    <Switch checked={p.isActive} onCheckedChange={() => toggleActive(p.id)} />
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PhrasesManagement;
