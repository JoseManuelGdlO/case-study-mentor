import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockCases, categories } from '@/data/mockData';
import { Plus, Search, Eye, Pencil, Trash2, Filter } from 'lucide-react';

const CaseList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filtered = mockCases.filter((c) => {
    const matchSearch = c.topic.toLowerCase().includes(search.toLowerCase()) || c.text.toLowerCase().includes(search.toLowerCase());
    const matchSpecialty = filterSpecialty === 'all' || c.specialty === filterSpecialty;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchSpecialty && matchStatus;
  });

  const statusColors: Record<string, string> = {
    published: 'bg-success/10 text-success border-success/30',
    draft: 'bg-warning/10 text-warning border-warning/30',
    archived: 'bg-muted text-muted-foreground',
  };
  const statusLabels: Record<string, string> = { published: 'Publicado', draft: 'Borrador', archived: 'Archivado' };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Casos Clínicos</h1>
          <p className="text-muted-foreground">Gestiona los casos clínicos de la plataforma</p>
        </div>
        <Button className="gradient-primary border-0 font-semibold gap-2" onClick={() => navigate('/backoffice/cases/new')}>
          <Plus className="w-4 h-4" /> Nuevo Caso
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por tema o contenido..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Especialidad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Borradores</SelectItem>
              <SelectItem value="archived">Archivados</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tema</TableHead>
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
                <TableCell>{c.specialty}</TableCell>
                <TableCell>{c.area}</TableCell>
                <TableCell>{c.language === 'es' ? '🇲🇽' : '🇺🇸'}</TableCell>
                <TableCell>{c.questions.length}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/backoffice/cases/${c.id}`)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default CaseList;
