import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HeartPulse, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, apiJson } from '@/lib/api';
import type { WeeklyWellbeingPayload, WellbeingTodayPayload } from '@/types';

type Mood = 'very_low' | 'low' | 'neutral' | 'good' | 'great';
type InterventionKind = 'breathing' | 'pomodoro' | 'break_reset' | 'grounding' | 'stretch';

type WellbeingNotificationSettings = {
  pushConfigured: boolean;
  vapidPublicKey: string | null;
  wellbeingPushEnabled: boolean;
  wellbeingReminderTime: string | null;
  wellbeingReminderDays: string[];
};

const moodLabel: Record<Mood, string> = {
  very_low: 'Muy bajo',
  low: 'Bajo',
  neutral: 'Neutral',
  good: 'Bien',
  great: 'Excelente',
};

const dayOptions = [
  { id: 'mon', label: 'Lun' },
  { id: 'tue', label: 'Mar' },
  { id: 'wed', label: 'Mié' },
  { id: 'thu', label: 'Jue' },
  { id: 'fri', label: 'Vie' },
  { id: 'sat', label: 'Sáb' },
  { id: 'sun', label: 'Dom' },
];

/** Ansiedad y enfoque van de 1 a 5 (coincide con el backend). */
function clampWellbeingScale(n: number): number {
  const x = Number.isFinite(n) ? Math.round(n) : 3;
  return Math.min(5, Math.max(1, x));
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function Wellbeing() {
  const [loading, setLoading] = useState(true);
  const [savingToday, setSavingToday] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [runningIntervention, setRunningIntervention] = useState<InterventionKind | null>(null);

  const [today, setToday] = useState<WellbeingTodayPayload | null>(null);
  const [weekly, setWeekly] = useState<WeeklyWellbeingPayload | null>(null);
  const [prefs, setPrefs] = useState<WellbeingNotificationSettings | null>(null);
  const [localPushSubscribed, setLocalPushSubscribed] = useState(false);

  const [mood, setMood] = useState<Mood>('neutral');
  const [anxietyLevel, setAnxietyLevel] = useState(3);
  const [focusLevel, setFocusLevel] = useState(3);
  const [sleepHours, setSleepHours] = useState('7');
  const [plannedStudyMinutes, setPlannedStudyMinutes] = useState('90');
  const [completedStudyMinutes, setCompletedStudyMinutes] = useState('0');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [todayJson, weeklyJson, prefJson] = await Promise.all([
        apiJson<{ data: WellbeingTodayPayload }>('/api/study-plan/wellbeing/today'),
        apiJson<{ data: WeeklyWellbeingPayload }>('/api/study-plan/wellbeing/weekly'),
        apiJson<{ data: WellbeingNotificationSettings }>('/api/profile/wellbeing-notifications'),
      ]);
      setToday(todayJson.data);
      setWeekly(weeklyJson.data);
      setPrefs(prefJson.data);

      if (todayJson.data.log) {
        const log = todayJson.data.log;
        setMood(log.mood);
        setAnxietyLevel(clampWellbeingScale(log.anxietyLevel));
        setFocusLevel(clampWellbeingScale(log.focusLevel));
        setSleepHours(log.sleepHours != null ? String(log.sleepHours) : '7');
        setPlannedStudyMinutes(String(log.plannedStudyMinutes));
        setCompletedStudyMinutes(String(log.completedStudyMinutes));
        setNotes(log.notes ?? '');
      }

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager?.getSubscription();
        setLocalPushSubscribed(!!sub);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cargar el panel de bienestar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveToday = async () => {
    setSavingToday(true);
    try {
      const a = clampWellbeingScale(anxietyLevel);
      const f = clampWellbeingScale(focusLevel);
      setAnxietyLevel(a);
      setFocusLevel(f);
      await apiJson('/api/study-plan/wellbeing/today', {
        method: 'POST',
        body: JSON.stringify({
          mood,
          anxietyLevel: a,
          focusLevel: f,
          sleepHours: sleepHours ? Number(sleepHours) : null,
          plannedStudyMinutes: Number(plannedStudyMinutes) || 0,
          completedStudyMinutes: Number(completedStudyMinutes) || 0,
          notes: notes.trim() || null,
        }),
      });
      toast.success('Check-in guardado');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo guardar el check-in');
    } finally {
      setSavingToday(false);
    }
  };

  const runIntervention = async (kind: InterventionKind, durationMinutes = 5) => {
    setRunningIntervention(kind);
    try {
      await apiJson('/api/study-plan/wellbeing/interventions', {
        method: 'POST',
        body: JSON.stringify({ kind, durationMinutes, completed: true }),
      });
      toast.success('Intervención registrada');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo registrar la intervención');
    } finally {
      setRunningIntervention(null);
    }
  };

  const toggleReminderDay = (day: string) => {
    if (!prefs) return;
    const next = prefs.wellbeingReminderDays.includes(day)
      ? prefs.wellbeingReminderDays.filter((d) => d !== day)
      : [...prefs.wellbeingReminderDays, day];
    setPrefs({ ...prefs, wellbeingReminderDays: next });
  };

  const saveNotificationPrefs = async () => {
    if (!prefs) return;
    setSavingPrefs(true);
    try {
      await apiJson('/api/profile/wellbeing-notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          wellbeingPushEnabled: prefs.wellbeingPushEnabled,
          wellbeingReminderTime: prefs.wellbeingReminderTime,
          wellbeingReminderDays: prefs.wellbeingReminderDays,
        }),
      });
      toast.success('Preferencias de recordatorio guardadas');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudieron guardar las preferencias');
    } finally {
      setSavingPrefs(false);
    }
  };

  const enablePush = async () => {
    if (!prefs?.vapidPublicKey || !prefs.pushConfigured) {
      toast.error('Push no está configurado en el servidor');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.error('Permiso de notificaciones denegado');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const key = urlBase64ToUint8Array(prefs.vapidPublicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Suscripción del navegador incompleta');
      }
      await apiJson('/api/profile/wellbeing-notifications/subscription', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      setLocalPushSubscribed(true);
      toast.success('Notificaciones push activadas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo activar push');
    }
  };

  const disablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await apiFetch('/api/profile/wellbeing-notifications/subscription', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setLocalPushSubscribed(false);
      toast.success('Push desactivado en este navegador');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo desactivar push');
    }
  };

  const adherenceToday = useMemo(() => {
    const planned = Number(plannedStudyMinutes) || 0;
    const completed = Number(completedStudyMinutes) || 0;
    return planned > 0 ? Math.min(100, Math.round((completed / planned) * 100)) : 0;
  }, [plannedStudyMinutes, completedStudyMinutes]);

  if (loading || !prefs) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-muted-foreground flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <HeartPulse className="w-7 h-7 text-primary" />
          Bienestar y hábitos
        </h1>
        <p className="text-muted-foreground">Gestiona ansiedad, foco y descanso para llegar mejor al examen.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Check-in diario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Estado de ánimo</Label>
              <Select value={mood} onValueChange={(v) => setMood(v as Mood)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(moodLabel).map(([id, label]) => (
                    <SelectItem key={id} value={id}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <Label>Ansiedad (1–5)</Label>
                <span className="text-sm font-medium tabular-nums text-foreground">{anxietyLevel}</span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[anxietyLevel]}
                onValueChange={([v]) => setAnxietyLevel(clampWellbeingScale(v))}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">1 = baja · 5 = alta</p>
            </div>
            <div className="space-y-2 md:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <Label>Enfoque (1–5)</Label>
                <span className="text-sm font-medium tabular-nums text-foreground">{focusLevel}</span>
              </div>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[focusLevel]}
                onValueChange={([v]) => setFocusLevel(clampWellbeingScale(v))}
                className="py-2"
              />
              <p className="text-xs text-muted-foreground">1 = bajo · 5 = alto</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Horas de sueño</Label>
              <Input type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Minutos planeados</Label>
              <Input type="number" min={0} max={1440} value={plannedStudyMinutes} onChange={(e) => setPlannedStudyMinutes(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Minutos completados</Label>
              <Input type="number" min={0} max={1440} value={completedStudyMinutes} onChange={(e) => setCompletedStudyMinutes(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notas breves</Label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Adherencia del día: {adherenceToday}%</p>
            <Progress value={adherenceToday} className="h-2" />
          </div>
          <Button onClick={() => void saveToday()} disabled={savingToday}>
            {savingToday ? 'Guardando…' : 'Guardar check-in'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Intervenciones rápidas</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Button variant="outline" disabled={runningIntervention === 'breathing'} onClick={() => void runIntervention('breathing', 5)}>
            Respiración 5 min
          </Button>
          <Button variant="outline" disabled={runningIntervention === 'grounding'} onClick={() => void runIntervention('grounding', 3)}>
            Grounding 3 min
          </Button>
          <Button variant="outline" disabled={runningIntervention === 'pomodoro'} onClick={() => void runIntervention('pomodoro', 25)}>
            Pomodoro 25 min
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumen semanal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Ansiedad promedio: <span className="font-medium text-foreground">{weekly?.summary.avgAnxiety ?? 0}</span> · Enfoque promedio:{' '}
            <span className="font-medium text-foreground">{weekly?.summary.avgFocus ?? 0}</span> · Adherencia promedio:{' '}
            <span className="font-medium text-foreground">{weekly?.summary.avgAdherence ?? 0}%</span>
          </p>
          <div className="space-y-1">
            {(weekly?.days ?? []).map((day) => (
              <div key={day.date} className="text-xs text-muted-foreground border rounded p-2">
                {day.date} · Ansiedad {day.anxietyLevel ?? 0} · Enfoque {day.focusLevel ?? 0} · Adherencia {day.adherencePercent}% · Intervenciones {day.interventionsCount}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Recordatorios push
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Label>Activar recordatorios de bienestar</Label>
            <Switch
              checked={prefs.wellbeingPushEnabled}
              onCheckedChange={(v) => setPrefs({ ...prefs, wellbeingPushEnabled: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Hora del recordatorio</Label>
            <Input
              type="time"
              value={prefs.wellbeingReminderTime ?? '20:00'}
              onChange={(e) => setPrefs({ ...prefs, wellbeingReminderTime: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Días</Label>
            <div className="flex flex-wrap gap-2">
              {dayOptions.map((d) => (
                <Button
                  key={d.id}
                  type="button"
                  size="sm"
                  variant={prefs.wellbeingReminderDays.includes(d.id) ? 'default' : 'outline'}
                  onClick={() => toggleReminderDay(d.id)}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {localPushSubscribed ? (
              <Button type="button" variant="outline" onClick={() => void disablePush()}>
                Desactivar push en este navegador
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => void enablePush()} disabled={!prefs.pushConfigured}>
                Activar push en este navegador
              </Button>
            )}
            <Button onClick={() => void saveNotificationPrefs()} disabled={savingPrefs}>
              {savingPrefs ? 'Guardando…' : 'Guardar preferencias'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
