import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

type AppRole = 'admin' | 'editor' | 'user';

function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('editor')) return 'editor';
  return 'user';
}

type BackofficeUserRow = {
  id: string;
  name: string;
  email: string;
  roles: AppRole[];
  plan: string;
  status: string;
  registeredAt: string;
  lastAccess: string;
  examsCompleted: number;
};

const roleLabel = (r: AppRole) =>
  r === 'admin' ? 'Administrador' : r === 'editor' ? 'Editor' : 'Estudiante';

const UserManagement = () => {
  const [users, setUsers] = useState<BackofficeUserRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [loading, setLoading] = useState(true);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createFirstName, setCreateFirstName] = useState('');
  const [createLastName, setCreateLastName] = useState('');
  const [createRole, setCreateRole] = useState<AppRole>('user');
  const [creating, setCreating] = useState(false);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      if (searchDebounced) qs.set('search', searchDebounced);
      if (roleFilter !== 'all') qs.set('role', roleFilter);
      const json = await apiJson<{
        data: BackofficeUserRow[];
        totalPages: number;
        page: number;
      }>(`/api/backoffice/users?${qs.toString()}`);
      setUsers(json.data);
      setTotalPages(Math.max(1, json.totalPages));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [page, searchDebounced, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced, roleFilter]);

  const updateRoles = async (userId: string, roles: AppRole[], previous: AppRole[]) => {
    if (roles.length === 0) {
      toast.error('El usuario debe tener al menos un rol');
      return;
    }
    if (roles.length === 1 && primaryRole(previous) === roles[0]) return;
    try {
      await apiJson(`/api/backoffice/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ roles }),
      });
      toast.success('Roles actualizados');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword || !createFirstName.trim() || !createLastName.trim()) {
      toast.error('Completa todos los campos');
      return;
    }
    if (createPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setCreating(true);
    try {
      await apiJson('/api/backoffice/users', {
        method: 'POST',
        body: JSON.stringify({
          email: createEmail.trim(),
          password: createPassword,
          firstName: createFirstName.trim(),
          lastName: createLastName.trim(),
          roles: [createRole],
        }),
      });
      toast.success('Usuario creado');
      setCreateEmail('');
      setCreatePassword('');
      setCreateFirstName('');
      setCreateLastName('');
      setCreateRole('user');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Lista de perfiles y asignación de roles (admin / editor / estudiante)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Crear usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cu-email">Correo</Label>
              <Input
                id="cu-email"
                type="email"
                autoComplete="email"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-password">Contraseña inicial</Label>
              <Input
                id="cu-password"
                type="password"
                autoComplete="new-password"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-role">Rol</Label>
              <Select value={createRole} onValueChange={(v) => setCreateRole(v as AppRole)}>
                <SelectTrigger id="cu-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Estudiante</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-fn">Nombre</Label>
              <Input
                id="cu-fn"
                value={createFirstName}
                onChange={(e) => setCreateFirstName(e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-ln">Apellido</Label>
              <Input
                id="cu-ln"
                value={createLastName}
                onChange={(e) => setCreateLastName(e.target.value)}
                placeholder="Apellido"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full gradient-primary border-0" disabled={creating}>
                {creating ? 'Creando…' : 'Crear usuario'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as typeof roleFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="user">Estudiantes</SelectItem>
            <SelectItem value="editor">Editores</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="p-6 text-muted-foreground">Cargando…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Última actividad</TableHead>
                  <TableHead>Exámenes</TableHead>
                  <TableHead>Rol</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'}>
                            {roleLabel(r)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{u.plan}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.registeredAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.lastAccess).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-center">{u.examsCompleted}</TableCell>
                    <TableCell>
                      <Select
                        value={primaryRole(u.roles)}
                        onValueChange={(v) => updateRoles(u.id, [v as AppRole], u.roles)}
                      >
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">Estudiante</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
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
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
