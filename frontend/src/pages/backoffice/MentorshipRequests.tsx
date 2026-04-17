import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { apiJson } from '@/lib/api';

type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled';

type MentorshipRequestRow = {
  id: string;
  topic: string;
  context: string | null;
  availability: string | null;
  status: MentorshipStatus;
  statusNote: string | null;
  externalMeetingUrl: string | null;
  scheduledAt: string | null;
  createdAt: string;
  student: { id: string; name: string };
  mentor: { id: string; name: string } | null;
  specialty: { id: string; name: string } | null;
};

const statusLabel: Record<MentorshipStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  scheduled: 'Agendada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const statusOptions: MentorshipStatus[] = ['pending', 'accepted', 'rejected', 'scheduled', 'completed', 'cancelled'];

const MentorshipRequests = () => {
  const [items, setItems] = useState<MentorshipRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | MentorshipStatus>('all');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<MentorshipStatus>('accepted');
  const [statusNote, setStatusNote] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [externalMeetingUrl, setExternalMeetingUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: '1', limit: '50' });
      if (filterStatus !== 'all') qs.set('status', filterStatus);
      const json = await apiJson<{ data: MentorshipRequestRow[] }>(`/api/mentorship/requests?${qs.toString()}`);
      setItems(json.data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cargar mentorías');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const startEdit = (row: MentorshipRequestRow) => {
    setEditingId(row.id);
    setNewStatus(row.status === 'pending' ? 'accepted' : row.status);
    setStatusNote(row.statusNote ?? '');
    setScheduledAt(row.scheduledAt ? row.scheduledAt.slice(0, 16) : '');
    setExternalMeetingUrl(row.externalMeetingUrl ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setStatusNote('');
    setScheduledAt('');
    setExternalMeetingUrl('');
  };

  const saveEdit = async (id: string) => {
    setBusyId(id);
    try {
      await apiJson(`/api/mentorship/requests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: newStatus,
          statusNote: statusNote.trim() || null,
          scheduledAt: newStatus === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
          externalMeetingUrl: newStatus === 'scheduled' ? externalMeetingUrl.trim() || null : null,
        }),
      });
      toast.success('Solicitud actualizada');
      cancelEdit();
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo actualizar la solicitud');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Mentorías
          </h1>
          <p className="text-muted-foreground">Gestiona solicitudes 1:1 de estudiantes.</p>
        </div>
        <div className="w-56">
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as 'all' | MentorshipStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabel[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Solicitudes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">No hay solicitudes para este filtro.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estudiante</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Sesión</TableHead>
                  <TableHead>Creada</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div className="font-medium">{row.student.name}</div>
                      <div className="text-xs text-muted-foreground">{row.specialty?.name ?? 'Sin especialidad'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.topic}</div>
                      {row.context ? <div className="text-xs text-muted-foreground line-clamp-2">{row.context}</div> : null}
                    </TableCell>
                    <TableCell>{statusLabel[row.status]}</TableCell>
                    <TableCell className="text-sm">
                      {row.scheduledAt ? new Date(row.scheduledAt).toLocaleString('es-MX') : '—'}
                      {row.externalMeetingUrl ? (
                        <>
                          <br />
                          <a
                            className="text-primary hover:underline"
                            href={row.externalMeetingUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Enlace
                          </a>
                        </>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString('es-MX')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => startEdit(row)}>
                        Gestionar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actualizar solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nuevo estado</Label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as MentorshipStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions
                      .filter((s) => s !== 'pending')
                      .map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabel[status]}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {newStatus === 'scheduled' && (
                <>
                  <div className="space-y-2">
                    <Label>Fecha y hora</Label>
                    <Input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Enlace externo (Meet/Zoom)</Label>
                    <Input
                      placeholder="https://..."
                      value={externalMeetingUrl}
                      onChange={(e) => setExternalMeetingUrl(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nota para el estudiante</Label>
              <Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={4} />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => void saveEdit(editingId)}
                disabled={busyId === editingId || (newStatus === 'scheduled' && (!scheduledAt || !externalMeetingUrl.trim()))}
              >
                {busyId === editingId ? 'Guardando…' : 'Guardar cambios'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MentorshipRequests;
