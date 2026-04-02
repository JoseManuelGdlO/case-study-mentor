import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { CaseTextFormat, Category, ClinicalCase, PaginatedResponse, PaginationMeta } from '@/types';
import { htmlToPlainText } from '@/lib/richText';
import { Plus, Search, Eye, Pencil, Trash2, Upload, ChevronLeft, ChevronRight, Columns3 } from 'lucide-react';
import { apiJson, apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ColumnId =
  | 'topic'
  | 'description'
  | 'uploadedAt'
  | 'uploadedBy'
  | 'specialty'
  | 'area'
  | 'language'
  | 'generatedByIa'
  | 'questions'
  | 'status'
  | 'actions';

type ColumnConfig = {
  id: ColumnId;
  label: string;
  hideable: boolean;
  headerClassName?: string;
  cellClassName?: string;
};

const COLUMN_STORAGE_KEY = 'enarmx:backoffice:cases-table:column-visibility';
const COLUMNS: ColumnConfig[] = [
  { id: 'topic', label: 'Tema', hideable: true },
  { id: 'description', label: 'Descripcion', hideable: true },
  { id: 'uploadedAt', label: 'Fecha de subida', hideable: true },
  { id: 'uploadedBy', label: 'Usuario subidor', hideable: true },
  { id: 'specialty', label: 'Especialidad', hideable: true },
  { id: 'area', label: 'Área', hideable: true },
  { id: 'language', label: 'Idioma', hideable: true },
  { id: 'generatedByIa', label: 'Generado por IA', hideable: true },
  { id: 'questions', label: 'Preguntas', hideable: true },
  { id: 'status', label: 'Estado', hideable: true },
  { id: 'actions', label: 'Acciones', hideable: false, headerClassName: 'text-right', cellClassName: 'text-right' },
];

const DEFAULT_COLUMN_VISIBILITY: Record<ColumnId, boolean> = {
  topic: true,
  description: true,
  uploadedAt: true,
  uploadedBy: true,
  specialty: true,
  area: true,
  language: true,
  generatedByIa: true,
  questions: true,
  status: true,
  actions: true,
};

const readColumnVisibility = (): Record<ColumnId, boolean> => {
  if (typeof window === 'undefined') return DEFAULT_COLUMN_VISIBILITY;
  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return DEFAULT_COLUMN_VISIBILITY;
    const parsed = JSON.parse(raw) as Partial<Record<ColumnId, boolean>>;
    return {
      ...DEFAULT_COLUMN_VISIBILITY,
      ...parsed,
      actions: true,
    };
  } catch {
    return DEFAULT_COLUMN_VISIBILITY;
  }
};

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [columnVisibility, setColumnVisibility] = useState<Record<ColumnId, boolean>>(readColumnVisibility);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleteStep, setBulkDeleteStep] = useState<1 | 2>(1);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const loadCases = useCallback(async () => {
    const qs = new URLSearchParams();
    qs.set('page', String(page));
    qs.set('limit', String(limit));
    if (filterStatus !== 'all') qs.set('status', filterStatus);
    if (filterSpecialty !== 'all') qs.set('specialty', filterSpecialty);
    try {
      const json = await apiJson<PaginatedResponse<ClinicalCase>>(`/api/cases?${qs.toString()}`);
      setCases(json.data);
      setPagination(
        json.meta ?? {
          page: json.page,
          limit,
          total: json.total,
          totalPages: json.totalPages,
          hasNext: json.page < json.totalPages,
          hasPrev: json.page > 1,
        }
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar casos');
    }
  }, [filterStatus, filterSpecialty, page, limit]);

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

  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterSpecialty, limit]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, filterStatus, filterSpecialty, limit]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch {
      // ignore storage write errors
    }
  }, [columnVisibility]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cases;
    const q = search.toLowerCase();
    return cases.filter((c) => {
      const textForSearch =
        c.textFormat === 'html' ? htmlToPlainText(c.text) : c.text;
      return c.topic.toLowerCase().includes(q) || textForSearch.toLowerCase().includes(q);
    });
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

  const filteredIds = useMemo(() => filtered.map((c) => c.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const someFilteredSelected = filteredIds.some((id) => selectedIds.has(id));

  const toggleSelectAllFiltered = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        for (const id of filteredIds) next.add(id);
      } else {
        for (const id of filteredIds) next.delete(id);
      }
      return next;
    });
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const openBulkDeleteDialog = () => {
    setBulkDeleteStep(1);
    setBulkDeleteOpen(true);
  };

  const onBulkDeleteOpenChange = (open: boolean) => {
    setBulkDeleteOpen(open);
    if (!open) {
      setBulkDeleteStep(1);
      setBulkDeleting(false);
    }
  };

  const executeBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkDeleting(true);
    try {
      const json = await apiJson<{ data: { deleted: number } }>('/api/cases/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      });
      toast.success(
        json.data.deleted === ids.length
          ? `Se eliminaron ${json.data.deleted} caso(s)`
          : `Se eliminaron ${json.data.deleted} de ${ids.length} caso(s)`
      );
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      setBulkDeleteStep(1);
      await loadCases();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setBulkDeleting(false);
    }
  };

  const selectedCasesOnPage = useMemo(
    () => cases.filter((c) => selectedIds.has(c.id)),
    [cases, selectedIds]
  );

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
  const getShortDescription = (text: string, format?: CaseTextFormat) => {
    const plain = format === 'html' ? htmlToPlainText(text) : text.trim();
    const normalized = plain.replace(/\s+/g, ' ');
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
  const visibleColumns = useMemo(
    () => COLUMNS.filter((column) => columnVisibility[column.id]),
    [columnVisibility]
  );
  const toggleColumn = (columnId: ColumnId, checked: boolean) => {
    setColumnVisibility((prev) => {
      if (columnId === 'actions') return prev;
      return {
        ...prev,
        [columnId]: checked,
      };
    });
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
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Por página" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 por página</SelectItem>
              <SelectItem value="20">20 por página</SelectItem>
              <SelectItem value="50">50 por página</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Columns3 className="w-4 h-4" /> Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Mostrar columnas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {COLUMNS.filter((column) => column.hideable).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={columnVisibility[column.id]}
                  onCheckedChange={(checked) => toggleColumn(column.id, checked === true)}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        {loading ? (
          <p className="p-6 text-muted-foreground">Cargando…</p>
        ) : (
          <>
            {isAdmin && selectedIds.size > 0 && (
              <div className="px-6 pt-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size} caso{selectedIds.size === 1 ? '' : 's'} seleccionado{selectedIds.size === 1 ? '' : 's'}
                </p>
                <Button type="button" variant="destructive" className="gap-2" onClick={openBulkDeleteDialog}>
                  <Trash2 className="w-4 h-4" /> Eliminar seleccionados ({selectedIds.size})
                </Button>
              </div>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && (
                    <TableHead className="w-12 pr-0">
                      <Checkbox
                        aria-label="Seleccionar todos en esta página"
                        checked={
                          allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false
                        }
                        onCheckedChange={(v) => toggleSelectAllFiltered(v === true)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableHead>
                  )}
                  {visibleColumns.map((column) => (
                    <TableHead key={column.id} className={column.headerClassName}>
                      {column.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                    {isAdmin && (
                      <TableCell className="w-12 pr-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Seleccionar ${c.topic}`}
                          checked={selectedIds.has(c.id)}
                          onCheckedChange={(v) => toggleSelectOne(c.id, v === true)}
                        />
                      </TableCell>
                    )}
                    {visibleColumns.map((column) => {
                    if (column.id === 'topic') {
                      return (
                        <TableCell key={column.id} className="font-medium">
                          {c.topic}
                        </TableCell>
                      );
                    }
                    if (column.id === 'description') {
                      return (
                        <TableCell key={column.id}>{getShortDescription(c.text, c.textFormat)}</TableCell>
                      );
                    }
                    if (column.id === 'uploadedAt') {
                      return <TableCell key={column.id}>{formatUploadDate(c.createdAt)}</TableCell>;
                    }
                    if (column.id === 'uploadedBy') {
                      return <TableCell key={column.id}>{c.createdBy?.name || c.createdBy?.email || 'No disponible'}</TableCell>;
                    }
                    if (column.id === 'specialty') {
                      return <TableCell key={column.id}>{c.specialty}</TableCell>;
                    }
                    if (column.id === 'area') {
                      return <TableCell key={column.id}>{c.area}</TableCell>;
                    }
                    if (column.id === 'language') {
                      return <TableCell key={column.id}>{c.language === 'es' ? '🇲🇽' : '🇺🇸'}</TableCell>;
                    }
                    if (column.id === 'generatedByIa') {
                      return (
                        <TableCell key={column.id}>
                          {c.generatedByIa ? (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                              Sí
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">No</span>
                          )}
                        </TableCell>
                      );
                    }
                    if (column.id === 'questions') {
                      return <TableCell key={column.id}>{c.questions.length}</TableCell>;
                    }
                    if (column.id === 'status') {
                      return (
                        <TableCell key={column.id}>
                          <Badge variant="outline" className={statusColors[c.status]}>
                            {statusLabels[c.status]}
                          </Badge>
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={column.id} className={column.cellClassName}>
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
                    );
                  })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </Card>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={onBulkDeleteOpenChange}>
        <AlertDialogContent>
          {bulkDeleteStep === 1 ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar casos seleccionados</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3 text-left">
                    <p>
                      Estás a punto de solicitar la eliminación de{' '}
                      <strong className="text-foreground">{selectedIds.size}</strong> caso
                      {selectedIds.size === 1 ? '' : 's'}.
                    </p>
                    {selectedCasesOnPage.length > 0 && (
                      <ul className="list-disc pl-5 text-sm max-h-32 overflow-y-auto">
                        {selectedCasesOnPage.slice(0, 8).map((c) => (
                          <li key={c.id} className="truncate">
                            {c.topic}
                          </li>
                        ))}
                        {selectedCasesOnPage.length > 8 && (
                          <li className="list-none text-muted-foreground">
                            … y {selectedCasesOnPage.length - 8} más
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button type="button" onClick={() => setBulkDeleteStep(2)}>
                  Continuar
                </Button>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar eliminación definitiva?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Se eliminarán de forma permanente{' '}
                  {selectedIds.size} caso{selectedIds.size === 1 ? '' : 's'} y sus preguntas asociadas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button type="button" variant="outline" onClick={() => setBulkDeleteStep(1)}>
                  Volver
                </Button>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={bulkDeleting}
                  onClick={() => void executeBulkDelete()}
                >
                  {bulkDeleting ? 'Eliminando…' : 'Eliminar definitivamente'}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CaseList;
