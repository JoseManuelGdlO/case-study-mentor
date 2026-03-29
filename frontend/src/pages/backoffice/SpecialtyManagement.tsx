import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit, Save, X, FolderTree } from 'lucide-react';
import { categories as initialCategories } from '@/data/mockData';
import { type Category, type Subcategory } from '@/types';
import { useToast } from '@/hooks/use-toast';

const SpecialtyManagement = () => {
  const { toast } = useToast();
  const [specs, setSpecs] = useState<Category[]>(initialCategories);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const toggle = (id: string) => setOpenIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const addSpecialty = () => {
    if (!newSpecName.trim()) return;
    const id = `spec-${Date.now()}`;
    setSpecs((prev) => [...prev, { id, name: newSpecName.trim(), subcategories: [] }]);
    setNewSpecName('');
    toast({ title: 'Especialidad agregada' });
  };

  const deleteSpecialty = (id: string) => {
    setSpecs((prev) => prev.filter((s) => s.id !== id));
    toast({ title: 'Especialidad eliminada' });
  };

  const addSubcategory = (specId: string) => {
    const name = newSubNames[specId]?.trim();
    if (!name) return;
    setSpecs((prev) =>
      prev.map((s) =>
        s.id === specId ? { ...s, subcategories: [...s.subcategories, { id: `sub-${Date.now()}`, name, categoryId: specId }] } : s
      )
    );
    setNewSubNames((prev) => ({ ...prev, [specId]: '' }));
    toast({ title: 'Subcategoría agregada' });
  };

  const deleteSubcategory = (specId: string, subId: string) => {
    setSpecs((prev) =>
      prev.map((s) => s.id === specId ? { ...s, subcategories: s.subcategories.filter((sc) => sc.id !== subId) } : s)
    );
    toast({ title: 'Subcategoría eliminada' });
  };

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditName(name); };
  const saveEdit = (specId: string, subId?: string) => {
    if (!editName.trim()) return;
    if (subId) {
      setSpecs((prev) =>
        prev.map((s) => s.id === specId ? { ...s, subcategories: s.subcategories.map((sc) => sc.id === subId ? { ...sc, name: editName.trim() } : sc) } : s)
      );
    } else {
      setSpecs((prev) => prev.map((s) => s.id === specId ? { ...s, name: editName.trim() } : s));
    }
    setEditingId(null);
    toast({ title: 'Nombre actualizado' });
  };

  // Mock case counts
  const caseCount = (specName: string) => Math.floor(Math.random() * 40) + 5;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Especialidades y Categorías</h1>
        <p className="text-muted-foreground">Administra el catálogo de especialidades médicas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nueva Especialidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input placeholder="Nombre de la especialidad..." value={newSpecName} onChange={(e) => setNewSpecName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSpecialty()} />
            <Button onClick={addSpecialty} className="gradient-primary border-0">Agregar</Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {specs.map((spec) => {
          const isOpen = openIds.includes(spec.id);
          return (
            <Card key={spec.id}>
              <Collapsible open={isOpen} onOpenChange={() => toggle(spec.id)}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 rounded-t-lg transition-colors">
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <FolderTree className="w-5 h-5 text-primary" />
                      {editingId === spec.id ? (
                        <div className="flex items-center gap-2">
                          <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 w-[200px]" onKeyDown={(e) => e.key === 'Enter' && saveEdit(spec.id)} />
                          <Button size="icon" variant="ghost" onClick={() => saveEdit(spec.id)}><Save className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                        </div>
                      ) : (
                        <span className="font-semibold text-foreground">{spec.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{spec.subcategories.length} subcategorías</Badge>
                      <Badge variant="outline">{caseCount(spec.name)} casos</Badge>
                      {editingId !== spec.id && (
                        <>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); startEdit(spec.id, spec.name); }}><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteSpecialty(spec.id); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t border-border ml-8">
                    {spec.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                        {editingId === sub.id ? (
                          <div className="flex items-center gap-2">
                            <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 w-[200px]" onKeyDown={(e) => e.key === 'Enter' && saveEdit(spec.id, sub.id)} />
                            <Button size="icon" variant="ghost" onClick={() => saveEdit(spec.id, sub.id)}><Save className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                          </div>
                        ) : (
                          <span className="text-sm text-foreground">{sub.name}</span>
                        )}
                        {editingId !== sub.id && (
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(sub.id, sub.name)}><Edit className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteSubcategory(spec.id, sub.id)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Input placeholder="Nueva subcategoría..." value={newSubNames[spec.id] || ''} onChange={(e) => setNewSubNames((prev) => ({ ...prev, [spec.id]: e.target.value }))} className="h-8 text-sm" onKeyDown={(e) => e.key === 'Enter' && addSubcategory(spec.id)} />
                      <Button size="sm" variant="outline" onClick={() => addSubcategory(spec.id)} className="gap-1">
                        <Plus className="w-3 h-3" /> Agregar
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SpecialtyManagement;
