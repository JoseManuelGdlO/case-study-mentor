import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, UserPlus, Ban, CheckCircle, Edit } from 'lucide-react';
import { mockSystemUsers, mockAdminUsers, type SystemUser } from '@/data/backofficeData';
import { useToast } from '@/hooks/use-toast';

const planLabels: Record<string, string> = { free: 'Gratis', monthly: 'Mensual', semester: 'Semestral', annual: 'Anual' };
const planColors: Record<string, string> = { free: 'secondary', monthly: 'default', semester: 'default', annual: 'default' };

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState(mockSystemUsers);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || u.plan === planFilter;
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const toggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' as const : 'active' as const } : u)
    );
    toast({ title: 'Estado actualizado', description: 'El estado del usuario ha sido modificado.' });
  };

  const changePlan = (userId: string, newPlan: SystemUser['plan']) => {
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: newPlan } : u));
    toast({ title: 'Plan actualizado', description: `Plan cambiado a ${planLabels[newPlan]}.` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Administra estudiantes y editores del sistema</p>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Estudiantes ({users.length})</TabsTrigger>
          <TabsTrigger value="admins">Editores ({mockAdminUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Plan" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los planes</SelectItem>
                <SelectItem value="free">Gratis</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="semester">Semestral</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="suspended">Suspendidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Último acceso</TableHead>
                    <TableHead>Exámenes</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Select value={u.plan} onValueChange={(v) => changePlan(u.id, v as SystemUser['plan'])}>
                          <SelectTrigger className="w-[120px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Gratis</SelectItem>
                            <SelectItem value="monthly">Mensual</SelectItem>
                            <SelectItem value="semester">Semestral</SelectItem>
                            <SelectItem value="annual">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                          {u.status === 'active' ? 'Activo' : 'Suspendido'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.registeredAt}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.lastAccess}</TableCell>
                      <TableCell className="text-center">{u.examsCompleted}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleStatus(u.id)} title={u.status === 'active' ? 'Suspender' : 'Activar'}>
                          {u.status === 'active' ? <Ban className="w-4 h-4 text-destructive" /> : <CheckCircle className="w-4 h-4 text-success" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button className="gradient-primary border-0 gap-2">
              <UserPlus className="w-4 h-4" /> Invitar Editor
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAdminUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role === 'admin' ? 'Administrador' : 'Editor'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.createdAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
