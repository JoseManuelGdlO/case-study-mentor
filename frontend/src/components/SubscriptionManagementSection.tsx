import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';
import { CANCEL_REASON_OPTIONS, type CancelReason } from '@/constants/cancellation-feedback';

type CancelFeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  busy: boolean;
  onConfirm: (payload: { reason: CancelReason; details: string | null }) => Promise<void>;
};

function CancelFeedbackDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
}: CancelFeedbackDialogProps) {
  const [reason, setReason] = useState<CancelReason | ''>('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (open) {
      setReason('');
      setDetails('');
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!reason) {
      toast.error('Selecciona un motivo');
      return;
    }
    const trimmed = details.trim();
    await onConfirm({
      reason,
      details: trimmed.length > 0 ? trimmed : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">¿Por qué cancelas?</Label>
            <p className="text-xs text-muted-foreground">Tu respuesta nos ayuda a mejorar el servicio.</p>
            <Select value={reason || undefined} onValueChange={(v) => setReason(v as CancelReason)}>
              <SelectTrigger id="cancel-reason" className="w-full">
                <SelectValue placeholder="Selecciona un motivo" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASON_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancel-details">Comentarios adicionales (opcional)</Label>
            <Textarea
              id="cancel-details"
              placeholder="Cuéntanos más si quieres…"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={2000}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{details.length}/2000</p>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Volver
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || !reason}
            onClick={() => void handleConfirm()}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const SubscriptionManagementSection = () => {
  const { refreshUser, user } = useAuth();
  const [cancelStripeOpen, setCancelStripeOpen] = useState(false);
  const [cancelStripeBusy, setCancelStripeBusy] = useState(false);
  const [cancelPayPalOpen, setCancelPayPalOpen] = useState(false);
  const [cancelPayPalBusy, setCancelPayPalBusy] = useState(false);

  const cancelStripeSubscription = async (payload: { reason: CancelReason; details: string | null }) => {
    setCancelStripeBusy(true);
    try {
      await apiJson('/api/payments/stripe/cancel-subscription', {
        method: 'POST',
        body: JSON.stringify({
          reason: payload.reason,
          details: payload.details,
        }),
      });
      await refreshUser();
      toast.success('Tu suscripción se cancelará al final del periodo pagado. Seguirás con acceso hasta esa fecha.');
      setCancelStripeOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cancelar la suscripción');
    } finally {
      setCancelStripeBusy(false);
    }
  };

  const cancelPayPalSubscription = async (payload: { reason: CancelReason; details: string | null }) => {
    setCancelPayPalBusy(true);
    try {
      await apiJson('/api/payments/paypal/cancel-subscription', {
        method: 'POST',
        body: JSON.stringify({
          reason: payload.reason,
          details: payload.details,
        }),
      });
      await refreshUser();
      toast.success('Tu suscripción de PayPal se ha cancelado según las condiciones de PayPal.');
      setCancelPayPalOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cancelar la suscripción');
    } finally {
      setCancelPayPalBusy(false);
    }
  };

  if (!user?.hasStripeSubscription && !user?.hasPayPalSubscription) {
    return null;
  }

  return (
    <div className="space-y-6">
      {user.hasStripeSubscription && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-warning" /> Membresía (Stripe)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tienes una suscripción recurrente con Stripe. Puedes cancelarla cuando quieras; seguirás con acceso hasta el
              final del periodo ya pagado.
            </p>
            {user.subscriptionCancelAtPeriodEnd ? (
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30">
                Cancelación programada al final del periodo
              </Badge>
            ) : (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setCancelStripeOpen(true)}>
                Cancelar suscripción
              </Button>
            )}

            <CancelFeedbackDialog
              open={cancelStripeOpen}
              onOpenChange={setCancelStripeOpen}
              title="¿Cancelar suscripción?"
              description={
                `No volveremos a cobrarte. Mantendrás el acceso completo hasta ${
                  user.subscriptionExpiresAt
                    ? new Date(user.subscriptionExpiresAt).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'el fin del periodo actual'
                }.`
              }
              confirmLabel="Sí, cancelar al final del periodo"
              busy={cancelStripeBusy}
              onConfirm={cancelStripeSubscription}
            />
          </CardContent>
        </Card>
      )}

      {user.hasPayPalSubscription && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Crown className="w-5 h-5 text-warning" /> Membresía (PayPal)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Tienes una suscripción recurrente con PayPal. Puedes cancelarla desde aquí; el efecto exacto depende del
              estado de tu suscripción en PayPal.
            </p>
            {user.subscriptionCancelAtPeriodEnd ? (
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30">
                Cancelación solicitada
              </Badge>
            ) : (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setCancelPayPalOpen(true)}>
                Cancelar suscripción
              </Button>
            )}

            <CancelFeedbackDialog
              open={cancelPayPalOpen}
              onOpenChange={setCancelPayPalOpen}
              title="¿Cancelar suscripción PayPal?"
              description="Se enviará la cancelación a PayPal. Si tienes dudas, revisa también el centro de PayPal."
              confirmLabel="Sí, cancelar"
              busy={cancelPayPalBusy}
              onConfirm={cancelPayPalSubscription}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManagementSection;
