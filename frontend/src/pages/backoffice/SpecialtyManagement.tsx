import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Trash2, Edit, Save, X, FolderTree } from 'lucide-react';
import { type Category } from '@/types';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type BackofficeArea = { id: string; name: string };
type BackofficeSpecialtyRow = { id: string; name: string; areas: BackofficeArea[] };

function normalizeCategories(rows: BackofficeSpecialtyRow[]): Category[] {
  return rows.map((s) => ({
    id: s.id,
    name: s.name,
    subcategories: s.areas.map((a) => ({ id: a.id, name: a.name, categoryId: s.id })),
  }));
}

const SpecialtyManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin') ?? false;
  const [specs, setSpecs] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSubNames, setNewSubNames] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    try {
      const json = await apiJson<{ data: BackofficeSpecialtyRow[] }>('/api/backoffice/specialties');
      setSpecs(normalizeCategories(json.data));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar especialidades');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) =>
    setOpenIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addSpecialty = async () => {
    if (!newSpecName.trim()) return;
    try {
      await apiJson<{ data: { id: string; name: string } }>('/api/backoffice/specialties', {
        method: 'POST',
        body: JSON.stringify({ name: newSpecName.trim() }),
      });
      setNewSpecName('');
      toast.success('Especialidad agregada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const deleteSpecialty = async (id: string) => {
    if (!confirm('¿Eliminar esta especialidad y todas sus áreas?')) return;
    try {
      await apiJson(`/api/backoffice/specialties/${id}`, { method: 'DELETE' });
      toast.success('Especialidad eliminada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const addSubcategory = async (specId: string) => {
    const name = newSubNames[specId]?.trim();
    if (!name) return;
    try {
      await apiJson(`/api/backoffice/specialties/${specId}/areas`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setNewSubNames((prev) => ({ ...prev, [specId]: '' }));
      toast.success('Área agregada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const deleteSubcategory = async (_specId: string, subId: string) => {
    if (!confirm('¿Eliminar esta área?')) return;
    try {
      await apiJson(`/api/backoffice/areas/${subId}`, { method: 'DELETE' });
      toast.success('Área eliminada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const saveEdit = async (specId: string, subId?: string) => {
    if (!editName.trim()) return;
    try {
      if (subId) {
        await apiJson(`/api/backoffice/areas/${subId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: editName.trim() }),
        });
      } else {
        await apiJson(`/api/backoffice/specialties/${specId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: editName.trim() }),
        });
      }
      setEditingId(null);
      toast.success('Nombre actualizado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Cargando especialidades…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Especialidades y Categorías</h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'Administra el catálogo de especialidades médicas'
            : 'Agrega especialidades y áreas; solo un administrador puede editar o eliminar entradas existentes'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" /> Nueva Especialidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre de la especialidad..."
              value={newSpecName}
              onChange={(e) => setNewSpecName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSpecialty()}
            />
            <Button onClick={addSpecialty} className="gradient-primary border-0">
              Agregar
            </Button>
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
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                      <FolderTree className="w-5 h-5 text-primary" />
                      {editingId === spec.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-8 w-[200px]"
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit(spec.id)}
                          />
                          <Button size="icon" variant="ghost" onClick={() => saveEdit(spec.id)}>
                            <Save className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="font-semibold text-foreground">{spec.name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{spec.subcategories.length} áreas</Badge>
                      {isAdmin && editingId !== spec.id && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEdit(spec.id, spec.name);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSpecialty(spec.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
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
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-8 w-[200px]"
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(spec.id, sub.id)}
                            />
                            <Button size="icon" variant="ghost" onClick={() => saveEdit(spec.id, sub.id)}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-foreground">{sub.name}</span>
                        )}
                        {isAdmin && editingId !== sub.id && (
                          <div className="flex items-center gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(sub.id, sub.name)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => deleteSubcategory(spec.id, sub.id)}
                            >
                              <Trash2 className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <Input
                        placeholder="Nueva área..."
                        value={newSubNames[spec.id] || ''}
                        onChange={(e) => setNewSubNames((prev) => ({ ...prev, [spec.id]: e.target.value }))}
                        className="h-8 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && addSubcategory(spec.id)}
                      />
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
