import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, ChevronLeft, ChevronRight, UserPlus, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { PaginatedResponse } from '@/types';

type AppRole = 'admin' | 'editor' | 'user';

function primaryRole(roles: AppRole[]): AppRole {
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('editor')) return 'editor';
  return 'user';
}

type UserPlan = 'free' | 'monthly' | 'semester' | 'annual';

function normalizeUserPlan(p: string): UserPlan {
  if (p === 'free' || p === 'monthly' || p === 'semester' || p === 'annual') return p;
  return 'free';
}

type BackofficeUserRow = {
  id: string;
  name: string;
  email: string;
  authProvider: 'email' | 'google';
  roles: AppRole[];
  plan: UserPlan;
  status: string;
  registeredAt: string;
  lastAccess: string;
  examsCompleted: number;
};

function rolesSignature(roles: AppRole[]): string {
  return [...roles].sort().join(',');
}

function canViewAsStudent(roles: AppRole[]): boolean {
  return !roles.includes('admin') && !roles.includes('editor');
}

const UserManagement = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [users, setUsers] = useState<BackofficeUserRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
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
  const [drafts, setDrafts] = useState<
    Record<string, { email: string; role: AppRole; plan: UserPlan }>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [viewAsId, setViewAsId] = useState<string | null>(null);
  const [planConfirmUser, setPlanConfirmUser] = useState<BackofficeUserRow | null>(null);
  const [planConfirmPassword, setPlanConfirmPassword] = useState('');
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
      const json = await apiJson<PaginatedResponse<BackofficeUserRow>>(`/api/backoffice/users?${qs.toString()}`);
      setUsers(json.data);
      const resolvedTotalPages = Math.max(1, json.meta?.totalPages ?? json.totalPages);
      const resolvedPage = json.meta?.page ?? json.page;
      setTotalPages(resolvedTotalPages);
      setHasNext(json.meta?.hasNext ?? resolvedPage < resolvedTotalPages);
      setHasPrev(json.meta?.hasPrev ?? resolvedPage > 1);
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

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        users.map((u) => [
          u.id,
          { email: u.email, role: primaryRole(u.roles), plan: normalizeUserPlan(u.plan) },
        ])
      )
    );
  }, [users]);

  const commitSave = async (u: BackofficeUserRow, planPassword?: string) => {
    const d = drafts[u.id];
    if (!d) return;
    const emailTrim = d.email.trim();
    if (!emailTrim) {
      toast.error('El correo no puede estar vacío');
      return;
    }
    const emailChanged = u.authProvider === 'email' && emailTrim !== u.email;
    const rolesChanged = rolesSignature(u.roles) !== rolesSignature([d.role]);
    const planChanged = d.plan !== normalizeUserPlan(u.plan);
    if (!emailChanged && !rolesChanged && !planChanged) {
      toast.info('Sin cambios');
      return;
    }
    const payload: {
      email?: string;
      roles?: AppRole[];
      subscriptionTier?: UserPlan;
      confirmationPassword?: string;
    } = {};
    if (emailChanged) payload.email = emailTrim;
    if (rolesChanged) payload.roles = [d.role];
    if (planChanged) {
      payload.subscriptionTier = d.plan;
      if (planPassword !== undefined) payload.confirmationPassword = planPassword;
    }
    setSavingId(u.id);
    try {
      await apiJson(`/api/backoffice/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      toast.success('Usuario actualizado');
      setPlanConfirmUser(null);
      setPlanConfirmPassword('');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSavingId(null);
    }
  };

  const saveUser = (u: BackofficeUserRow) => {
    const d = drafts[u.id];
    if (!d) return;
    const emailTrim = d.email.trim();
    if (!emailTrim) {
      toast.error('El correo no puede estar vacío');
      return;
    }
    const emailChanged = u.authProvider === 'email' && emailTrim !== u.email;
    const rolesChanged = rolesSignature(u.roles) !== rolesSignature([d.role]);
    const planChanged = d.plan !== normalizeUserPlan(u.plan);
    if (!emailChanged && !rolesChanged && !planChanged) {
      toast.info('Sin cambios');
      return;
    }
    if (planChanged) {
      setPlanConfirmUser(u);
      setPlanConfirmPassword('');
      return;
    }
    void commitSave(u);
  };

  const confirmPlanSave = () => {
    if (!planConfirmUser) return;
    void commitSave(planConfirmUser, planConfirmPassword);
  };

  const viewAsStudent = async (u: BackofficeUserRow) => {
    if (!canViewAsStudent(u.roles)) return;
    setViewAsId(u.id);
    try {
      await apiJson('/api/backoffice/impersonate', {
        method: 'POST',
        body: JSON.stringify({ userId: u.id }),
      });
      const next = await refreshUser();
      if (next) {
        navigate(next.onboardingDone ? '/dashboard' : '/onboarding');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo iniciar la vista de estudiante');
    } finally {
      setViewAsId(null);
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
        <p className="text-muted-foreground">
          Lista de perfiles, roles (admin / editor / estudiante) y plan de suscripción. El cambio de plan
          requiere contraseña de confirmación.
        </p>
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
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Última actividad</TableHead>
                  <TableHead>Exámenes</TableHead>
                  <TableHead className="w-[220px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name || '—'}</TableCell>
                    <TableCell className="min-w-[200px]">
                      <Input
                        type="email"
                        autoComplete="off"
                        value={drafts[u.id]?.email ?? u.email}
                        disabled={u.authProvider !== 'email'}
                        title={
                          u.authProvider !== 'email'
                            ? 'Las cuentas de Google no se pueden editar aquí'
                            : undefined
                        }
                        onChange={(e) =>
                          setDrafts((prev) => {
                            const cur = prev[u.id] ?? {
                              email: u.email,
                              role: primaryRole(u.roles),
                              plan: normalizeUserPlan(u.plan),
                            };
                            return { ...prev, [u.id]: { ...cur, email: e.target.value } };
                          })
                        }
                        className="h-8 text-sm"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={drafts[u.id]?.role ?? primaryRole(u.roles)}
                        onValueChange={(v) =>
                          setDrafts((prev) => {
                            const cur = prev[u.id] ?? {
                              email: u.email,
                              role: primaryRole(u.roles),
                              plan: normalizeUserPlan(u.plan),
                            };
                            return { ...prev, [u.id]: { ...cur, role: v as AppRole } };
                          })
                        }
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
                    <TableCell>
                      <Select
                        value={drafts[u.id]?.plan ?? normalizeUserPlan(u.plan)}
                        onValueChange={(v) =>
                          setDrafts((prev) => {
                            const cur = prev[u.id] ?? {
                              email: u.email,
                              role: primaryRole(u.roles),
                              plan: normalizeUserPlan(u.plan),
                            };
                            return { ...prev, [u.id]: { ...cur, plan: v as UserPlan } };
                          })
                        }
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
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
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.registeredAt).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.lastAccess).toLocaleDateString('es-MX')}
                    </TableCell>
                    <TableCell className="text-center">{u.examsCompleted}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {canViewAsStudent(u.roles) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={viewAsId === u.id || savingId === u.id}
                            onClick={() => void viewAsStudent(u)}
                            title="Ver el portal como este estudiante"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {viewAsId === u.id ? 'Abriendo…' : 'Ver como'}
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            savingId === u.id || viewAsId === u.id || planConfirmUser?.id === u.id
                          }
                          onClick={() => saveUser(u)}
                        >
                          {savingId === u.id ? 'Guardando…' : 'Guardar'}
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
          <Button variant="outline" size="icon" disabled={!hasPrev} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <Dialog
        open={planConfirmUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPlanConfirmUser(null);
            setPlanConfirmPassword('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar cambio de plan</DialogTitle>
            <DialogDescription>
              Introduce la contraseña de confirmación del backoffice para aplicar el nuevo plan al usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="plan-confirm-pwd">Contraseña de confirmación</Label>
            <Input
              id="plan-confirm-pwd"
              type="password"
              autoComplete="off"
              value={planConfirmPassword}
              onChange={(e) => setPlanConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  confirmPlanSave();
                }
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPlanConfirmUser(null);
                setPlanConfirmPassword('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="gradient-primary border-0"
              disabled={
                !planConfirmPassword ||
                (planConfirmUser !== null && savingId === planConfirmUser.id)
              }
              onClick={() => confirmPlanSave()}
            >
              {planConfirmUser !== null && savingId === planConfirmUser.id ? 'Guardando…' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
