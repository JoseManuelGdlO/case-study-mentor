import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Category, ClinicalCase } from '@/types';
import { Plus, Search, Eye, Pencil, Trash2, Upload } from 'lucide-react';
import { apiJson, apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const CaseList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('admin');
  const [categories, setCategories] = useState<Category[]>([]);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [search, setSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadCases = useCallback(async () => {
    const qs = new URLSearchParams();
    qs.set('page', '1');
    qs.set('limit', '200');
    if (filterStatus !== 'all') qs.set('status', filterStatus);
    if (filterSpecialty !== 'all') qs.set('specialty', filterSpecialty);
    try {
      const json = await apiJson<{ data: ClinicalCase[] }>(`/api/cases?${qs.toString()}`);
      setCases(json.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar casos');
    }
  }, [filterStatus, filterSpecialty]);

  useEffect(() => {
    let c = false;
    apiJson<{ data: Category[] }>('/api/specialties')
      .then((r) => {
        if (!c) setCategories(r.data);
      })
      .catch(() => {});
    return () => {
      c = true;
    };
  }, []);

  useEffect(() => {
    let c = false;
    (async () => {
      setLoading(true);
      await loadCases();
      if (!c) setLoading(false);
    })();
    return () => {
      c = true;
    };
  }, [loadCases]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cases;
    const q = search.toLowerCase();
    return cases.filter(
      (c) => c.topic.toLowerCase().includes(q) || c.text.toLowerCase().includes(q)
    );
  }, [cases, search]);

  const deleteCase = async (id: string) => {
    if (!isAdmin || !confirm('¿Eliminar este caso?')) return;
    try {
      const res = await apiFetch(`/api/cases/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      toast.success('Caso eliminado');
      await loadCases();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const statusColors: Record<string, string> = {
    published: 'bg-success/10 text-success border-success/30',
    draft: 'bg-warning/10 text-warning border-warning/30',
    archived: 'bg-muted text-muted-foreground',
  };
  const statusLabels: Record<string, string> = {
    published: 'Publicado',
    draft: 'Borrador',
    archived: 'Archivado',
  };
  const getShortDescription = (text: string) => {
    const normalized = text.trim().replace(/\s+/g, ' ');
    if (!normalized) return '-';
    return normalized.split(' ').slice(0, 5).join(' ');
  };
  const formatUploadDate = (dateValue: string) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return '-';
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Casos Clínicos</h1>
          <p className="text-muted-foreground">Gestiona los casos clínicos de la plataforma</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" className="gap-2" onClick={() => navigate('/backoffice/cases/bulk-upload')}>
              <Upload className="w-4 h-4" /> Carga Masiva
            </Button>
          )}
          <Button className="gradient-primary border-0 font-semibold gap-2" onClick={() => navigate('/backoffice/cases/new')}>
            <Plus className="w-4 h-4" /> Nuevo Caso
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por tema o contenido..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="archived">Archivados</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        {loading ? (
          <p className="p-6 text-muted-foreground">Cargando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tema</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>Fecha de subida</TableHead>
                <TableHead>Usuario subidor</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Idioma</TableHead>
                <TableHead>Preguntas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{c.topic}</TableCell>
                  <TableCell>{getShortDescription(c.text)}</TableCell>
                  <TableCell>{formatUploadDate(c.createdAt)}</TableCell>
                  <TableCell>No disponible</TableCell>
                  <TableCell>{c.specialty}</TableCell>
                  <TableCell>{c.area}</TableCell>
                  <TableCell>{c.language === 'es' ? '🇲🇽' : '🇺🇸'}</TableCell>
                  <TableCell>{c.questions.length}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[c.status]}>
                      {statusLabels[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/backoffice/cases/${c.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/backoffice/cases/${c.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteCase(c.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default CaseList;
