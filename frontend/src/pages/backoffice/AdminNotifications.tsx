import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, apiJson } from '@/lib/api';

type AdminPushState = {
  pushConfigured: boolean;
  vapidPublicKey: string | null;
  notifyNewUser: boolean;
  notifyNewSubscription: boolean;
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AdminPushState | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [localSubscribed, setLocalSubscribed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiJson<{ data: AdminPushState }>('/api/backoffice/admin-push');
      setState(json.data);
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setLocalSubscribed(!!sub);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pushSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    (window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const enablePush = async () => {
    if (!state?.vapidPublicKey || !state.pushConfigured) {
      toast.error('Web Push no está configurado en el servidor');
      return;
    }
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.error('Permiso de notificaciones denegado');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      const key = urlBase64ToUint8Array(state.vapidPublicKey);
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('Suscripción del navegador incompleta');
      }
      await apiJson('/api/backoffice/admin-push/subscription', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        }),
      });
      setLocalSubscribed(true);
      toast.success('Notificaciones activadas en este navegador');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo activar');
    } finally {
      setSubscribing(false);
    }
  };

  const disablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await apiFetch('/api/backoffice/admin-push/subscription', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setLocalSubscribed(false);
      toast.success('Suscripción eliminada en este navegador');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al desactivar');
    }
  };

  const patchPref = async (patch: { notifyNewUser?: boolean; notifyNewSubscription?: boolean }) => {
    try {
      const json = await apiJson<{
        data: { adminPushNotifyNewUser: boolean; adminPushNotifyNewSubscription: boolean };
      }>('/api/backoffice/admin-push/preferences', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setState((s) =>
        s
          ? {
              ...s,
              notifyNewUser: json.data.adminPushNotifyNewUser,
              notifyNewSubscription: json.data.adminPushNotifyNewSubscription,
            }
          : s
      );
      toast.success('Preferencias guardadas');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  if (loading || !state) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notificaciones push</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Recibe avisos en el navegador cuando hay un nuevo registro público o un usuario pasa a plan de pago. Solo
          administradores.
        </p>
      </div>

      {!pushSupported && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          Tu navegador no soporta notificaciones push o necesitas HTTPS (excepto en localhost).
        </p>
      )}

      {!state.pushConfigured && (
        <p className="text-sm text-muted-foreground">
          El servidor no tiene configuradas las claves VAPID (VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT). Las
          notificaciones no se enviarán hasta que se configuren.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Este navegador
          </CardTitle>
          <CardDescription>Activa el permiso de notificaciones y registra este dispositivo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {localSubscribed ? (
            <Button type="button" variant="outline" className="gap-2" onClick={() => void disablePush()}>
              <BellOff className="h-4 w-4" />
              Quitar este navegador
            </Button>
          ) : (
            <Button
              type="button"
              className="gradient-primary border-0 gap-2"
              disabled={!pushSupported || !state.pushConfigured || subscribing}
              onClick={() => void enablePush()}
            >
              {subscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
              Activar notificaciones aquí
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Qué quieres recibir</CardTitle>
          <CardDescription>Puedes desactivar cada tipo por separado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pref-user">Nuevos registros</Label>
              <p className="text-xs text-muted-foreground">Registro con email o Google (no cuentas creadas en backoffice).</p>
            </div>
            <Switch
              id="pref-user"
              checked={state.notifyNewUser}
              onCheckedChange={(v) => void patchPref({ notifyNewUser: v })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pref-sub">Nuevas suscripciones de pago</Label>
              <p className="text-xs text-muted-foreground">Cuando un usuario pasa de plan gratis a uno de pago.</p>
            </div>
            <Switch
              id="pref-sub"
              checked={state.notifyNewSubscription}
              onCheckedChange={(v) => void patchPref({ notifyNewSubscription: v })}
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Safari tiene soporte limitado para Web Push. Se recomienda Chrome o Edge en escritorio o Android.
      </p>
    </div>
  );
}
