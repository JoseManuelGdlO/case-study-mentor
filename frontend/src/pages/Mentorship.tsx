import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Lock, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

type Specialty = { id: string; name: string };
type MentorshipRequest = {
  id: string;
  topic: string;
  context: string | null;
  availability: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'scheduled' | 'completed' | 'cancelled';
  statusNote: string | null;
  externalMeetingUrl: string | null;
  scheduledAt: string | null;
  createdAt: string;
  mentor: { id: string; name: string } | null;
  specialty: { id: string; name: string } | null;
};

const statusLabel: Record<MentorshipRequest['status'], string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  scheduled: 'Agendada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const Mentorship = () => {
  const navigate = useNavigate();
  const { isFreeUser } = useUser();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [availability, setAvailability] = useState('');
  const [specialtyId, setSpecialtyId] = useState('none');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRequests = async () => {
    const json = await apiJson<{ data: MentorshipRequest[] }>('/api/mentorship/requests/mine');
    setRequests(json.data);
  };

  useEffect(() => {
    if (isFreeUser) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [specialtiesJson, requestsJson] = await Promise.all([
          apiJson<{ data: Specialty[] }>('/api/specialties'),
          apiJson<{ data: MentorshipRequest[] }>('/api/mentorship/requests/mine'),
        ]);
        if (cancelled) return;
        setSpecialties(specialtiesJson.data);
        setRequests(requestsJson.data);
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'No se pudo cargar mentoría');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFreeUser]);

  const createRequest = async () => {
    if (topic.trim().length < 5) {
      toast.error('El tema debe tener al menos 5 caracteres');
      return;
    }
    setSaving(true);
    try {
      await apiJson('/api/mentorship/requests', {
        method: 'POST',
        body: JSON.stringify({
          topic: topic.trim(),
          context: context.trim() || null,
          availability: availability.trim() || null,
          specialtyId: specialtyId === 'none' ? null : specialtyId,
        }),
      });
      setTopic('');
      setContext('');
      setAvailability('');
      setSpecialtyId('none');
      await loadRequests();
      toast.success('Solicitud enviada');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo enviar la solicitud');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-5xl mx-auto p-6 text-muted-foreground">Cargando…</div>;

  if (isFreeUser) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Mentoría
          </h1>
          <p className="text-muted-foreground">Solicita sesiones 1:1 y seguimiento de tu avance.</p>
        </div>
        <div className="relative">
          <div className="filter blur-md pointer-events-none select-none opacity-50 space-y-4">
            <Card className="border-0 shadow-md">
              <CardHeader><CardTitle>Nueva solicitud</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="h-10 rounded bg-muted" />
                <div className="h-10 rounded bg-muted" />
                <div className="h-24 rounded bg-muted" />
                <div className="h-10 w-44 rounded bg-muted" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md h-56" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Mentoría Premium</h2>
            <p className="text-muted-foreground text-center max-w-sm">
              Suscríbete para solicitar sesiones con staff académico y dar seguimiento a tu plan.
            </p>
            <Button className="gradient-primary border-0 font-semibold gap-2 h-12 px-8" onClick={() => navigate('/dashboard/subscription')}>
              <Crown className="w-5 h-5" /> Suscribirme
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-7 h-7 text-primary" />
          Mentoría
        </h1>
        <p className="text-muted-foreground">Solicita una sesión y da seguimiento a tu agenda con staff académico.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nueva solicitud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tema principal</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej: Estrategia para cardio en ENARM" />
          </div>
          <div className="space-y-2">
            <Label>Especialidad (opcional)</Label>
            <Select value={specialtyId} onValueChange={setSpecialtyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una especialidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin especialidad</SelectItem>
                {specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contexto</Label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Disponibilidad</Label>
            <Textarea
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              rows={3}
              placeholder="Ej: Martes/Jueves 8pm a 10pm"
            />
          </div>
          <Button onClick={() => void createRequest()} disabled={saving}>
            {saving ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis solicitudes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!requests.length ? (
            <p className="text-sm text-muted-foreground">No tienes solicitudes todavía.</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="border rounded-md p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{req.topic}</h3>
                  <Badge variant="outline">{statusLabel[req.status]}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Creada el {new Date(req.createdAt).toLocaleString('es-MX')}
                  {req.specialty ? ` · ${req.specialty.name}` : ''}
                </p>
                {req.context && <p className="text-sm">{req.context}</p>}
                {req.statusNote && <p className="text-sm text-muted-foreground">Nota del mentor: {req.statusNote}</p>}
                {req.mentor && <p className="text-sm text-muted-foreground">Mentor asignado: {req.mentor.name}</p>}
                {req.scheduledAt && (
                  <p className="text-sm">
                    Sesión: {new Date(req.scheduledAt).toLocaleString('es-MX')}
                    {req.externalMeetingUrl && (
                      <>
                        {' '}
                        ·{' '}
                        <a href={req.externalMeetingUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          Abrir enlace
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Mentorship;
