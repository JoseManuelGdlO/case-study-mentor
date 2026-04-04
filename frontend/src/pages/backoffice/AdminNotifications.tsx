import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, apiJson } from '@/lib/api';

type AdminPushState = {
  pushConfigured: boolean;
  smtpConfigured: boolean;
  vapidPublicKey: string | null;
  notifyNewUser: boolean;
  notifyNewSubscription: boolean;
  emailNotifyNewUser: boolean;
  emailNotifyNewSubscription: boolean;
};

type PrefPatch = {
  notifyNewUser?: boolean;
  notifyNewSubscription?: boolean;
  emailNotifyNewUser?: boolean;
  emailNotifyNewSubscription?: boolean;
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

/**
 * Heurística síncrona; en algunos móviles el motor no expone bien `pushManager` en el prototype.
 * No debe usarse para deshabilitar el botón si ya hay contexto seguro + service workers.
 */
function hasWebPushApiSync(): boolean {
  try {
    if (!('serviceWorker' in navigator)) return false;
    if (typeof globalThis !== 'undefined' && 'PushManager' in globalThis) return true;
    if (typeof ServiceWorkerRegistration === 'undefined') return false;
    const proto = ServiceWorkerRegistration.prototype;
    if ('pushManager' in proto) return true;
    const d = Object.getOwnPropertyDescriptor(proto, 'pushManager');
    return Boolean(d?.get ?? d?.value);
  } catch {
    return false;
  }
}

function formatPushSubscribeError(e: unknown): string {
  if (!(e instanceof Error)) return 'No se pudo activar';
  const name = (e as DOMException).name;
  const msg = e.message;
  if (name === 'NotSupportedError' || /not supported/i.test(msg)) {
    return 'Este navegador no permite suscripción push aquí (en iPhone suele hacer falta la web instalada en inicio, iOS 16.4+).';
  }
  if (name === 'SecurityError' || /secure context|insecure/i.test(msg)) {
    return 'El navegador bloquea push por seguridad. Usa HTTPS con certificado válido, sin iframe de otro origen.';
  }
  return msg || 'No se pudo activar';
}

function isLikelyIOS(): boolean {
  const ua = navigator.userAgent || '';
  return (
    /iPhone|iPad|iPod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/** HTTPS, localhost o 127.0.0.1. `http://192.168…` no es contexto seguro: el push fallará aunque sea “Chrome”. */
function isSecureEnoughForPush(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.isSecureContext) return true;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

export default function AdminNotifications() {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AdminPushState | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [localSubscribed, setLocalSubscribed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiJson<{ data: Partial<AdminPushState> & Pick<AdminPushState, 'pushConfigured' | 'notifyNewUser' | 'notifyNewSubscription'> }>(
        '/api/backoffice/admin-push'
      );
      const d = json.data;
      setState({
        pushConfigured: d.pushConfigured,
        smtpConfigured: d.smtpConfigured ?? false,
        vapidPublicKey: d.vapidPublicKey ?? null,
        notifyNewUser: d.notifyNewUser ?? true,
        notifyNewSubscription: d.notifyNewSubscription ?? true,
        emailNotifyNewUser: d.emailNotifyNewUser ?? false,
        emailNotifyNewSubscription: d.emailNotifyNewSubscription ?? false,
      });
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          const sub = await reg?.pushManager?.getSubscription();
          setLocalSubscribed(!!sub);
        } catch {
          setLocalSubscribed(false);
        }
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

  const secureForPush = isSecureEnoughForPush();
  const pushApiHeuristic = hasWebPushApiSync();
  /** Con HTTPS real basta para intentar; la API se comprueba al pulsar. */
  const canTryPush = secureForPush && 'serviceWorker' in navigator;
  const httpsButNotSecureContext =
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    !window.isSecureContext;

  const enablePush = async () => {
    if (!state?.vapidPublicKey || !state.pushConfigured) {
      toast.error('Web Push no está configurado en el servidor');
      return;
    }
    if (!('serviceWorker' in navigator)) {
      toast.error('Tu navegador no soporta service workers; no se puede usar push.');
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
      toast.error(formatPushSubscribeError(e));
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

  const patchPref = async (patch: PrefPatch) => {
    try {
      const json = await apiJson<{
        data: {
          adminPushNotifyNewUser: boolean;
          adminPushNotifyNewSubscription: boolean;
          adminEmailNotifyNewUser: boolean;
          adminEmailNotifyNewSubscription: boolean;
        };
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
              emailNotifyNewUser: json.data.adminEmailNotifyNewUser,
              emailNotifyNewSubscription: json.data.adminEmailNotifyNewSubscription,
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
        <h1 className="text-2xl font-semibold tracking-tight">Avisos para administradores</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Push en el navegador y/o correo al email de tu cuenta cuando alguien se registra en público o pasa a un plan
          de pago. Solo cuentas con rol administrador.
        </p>
      </div>

      {httpsButNotSecureContext && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <span className="font-medium">La URL es https pero el navegador no considera la página segura</span>{' '}
          (<code className="text-xs">isSecureContext === false</code>). Suele pasar con certificados no confiables,
          ventanas dentro de <strong>iframes</strong>, o políticas del sistema. Abre el backoffice en una pestaña
          normal del mismo dominio.
        </p>
      )}
      {!secureForPush && !httpsButNotSecureContext && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <span className="font-medium">Conexión no segura para push.</span> Hay que abrir el sitio con{' '}
          <strong>https://</strong> y un dominio válido. Si entras por <strong>http://</strong> o por una IP local (
          <code className="text-xs">192.168…</code>, <code className="text-xs">10.…</code>), el navegador bloquea el
          push aunque uses Chrome. En desarrollo, usa localhost en el mismo equipo o un túnel HTTPS (ngrok, etc.).
        </p>
      )}
      {secureForPush && !pushApiHeuristic && (
        <p className="text-sm text-muted-foreground border border-border rounded-md p-3 bg-muted/40">
          {isLikelyIOS() ? (
            <>
              <span className="font-medium text-foreground">iPhone/iPad:</span> el motor es el de Safari. El push web
              suele funcionar solo con la web <strong>añadida a la pantalla de inicio</strong> (PWA), iOS 16.4+.
              Igual puedes pulsar <strong>Activar</strong> por si tu versión ya lo permite.
            </>
          ) : (
            <>
              No pudimos detectar la API de push de forma automática; en <strong>HTTPS</strong> puedes pulsar{' '}
              <strong>Activar</strong> igualmente. Si falla, actualiza Chrome o prueba otro navegador.
            </>
          )}
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
              disabled={!canTryPush || !state.pushConfigured || subscribing}
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
          <CardTitle className="text-lg">Push (navegador)</CardTitle>
          <CardDescription>
            Solo se envía a dispositivos donde hayas pulsado «Activar notificaciones». Puedes usar push y correo a la vez.
          </CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Correo electrónico
          </CardTitle>
          <CardDescription>
            Los avisos llegan al correo de tu cuenta de administrador. El servidor usa las variables{' '}
            <code className="text-xs">SMTP_HOST</code>, <code className="text-xs">SMTP_FROM</code>, etc.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!state.smtpConfigured && (
            <p className="text-sm text-amber-700 dark:text-amber-400">
              <span className="font-medium">SMTP no configurado.</span> Define al menos SMTP_HOST y SMTP_FROM en el API;
              sin eso no se enviarán correos aunque actives los interruptores.
            </p>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pref-email-user">Nuevos registros por correo</Label>
              <p className="text-xs text-muted-foreground">Mismo criterio que en push (registro público).</p>
            </div>
            <Switch
              id="pref-email-user"
              checked={state.emailNotifyNewUser}
              onCheckedChange={(v) => {
                if (v && !state.smtpConfigured) {
                  toast.warning('Configura SMTP en el servidor para recibir correos.');
                }
                void patchPref({ emailNotifyNewUser: v });
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pref-email-sub">Nuevas suscripciones por correo</Label>
              <p className="text-xs text-muted-foreground">Cuando un usuario pasa de plan gratis a uno de pago.</p>
            </div>
            <Switch
              id="pref-email-sub"
              checked={state.emailNotifyNewSubscription}
              onCheckedChange={(v) => {
                if (v && !state.smtpConfigured) {
                  toast.warning('Configura SMTP en el servidor para recibir correos.');
                }
                void patchPref({ emailNotifyNewSubscription: v });
              }}
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Push: HTTPS en producción; en iOS a menudo hace falta PWA en inicio. Correo: revisa carpeta spam y que el remitente
        SMTP sea válido.
      </p>
    </div>
  );
}
