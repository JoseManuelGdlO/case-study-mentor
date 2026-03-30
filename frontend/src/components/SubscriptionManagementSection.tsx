import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Crown } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

const SubscriptionManagementSection = () => {
  const { refreshUser, user } = useAuth();
  const [cancelStripeOpen, setCancelStripeOpen] = useState(false);
  const [cancelStripeBusy, setCancelStripeBusy] = useState(false);
  const [cancelPayPalOpen, setCancelPayPalOpen] = useState(false);
  const [cancelPayPalBusy, setCancelPayPalBusy] = useState(false);

  const cancelStripeSubscription = async () => {
    setCancelStripeBusy(true);
    try {
      await apiJson('/api/payments/stripe/cancel-subscription', { method: 'POST' });
      await refreshUser();
      toast.success('Tu suscripción se cancelará al final del periodo pagado. Seguirás con acceso hasta esa fecha.');
      setCancelStripeOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No se pudo cancelar la suscripción');
    } finally {
      setCancelStripeBusy(false);
    }
  };

  const cancelPayPalSubscription = async () => {
    setCancelPayPalBusy(true);
    try {
      await apiJson('/api/payments/paypal/cancel-subscription', { method: 'POST' });
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

            <AlertDialog open={cancelStripeOpen} onOpenChange={setCancelStripeOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar suscripción?</AlertDialogTitle>
                  <AlertDialogDescription>
                    No volveremos a cobrarte. Mantendrás el acceso completo hasta{' '}
                    {user.subscriptionExpiresAt
                      ? new Date(user.subscriptionExpiresAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'el fin del periodo actual'}
                    .
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={cancelStripeBusy}>Volver</AlertDialogCancel>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={cancelStripeBusy}
                    onClick={() => void cancelStripeSubscription()}
                  >
                    {cancelStripeBusy ? 'Procesando…' : 'Sí, cancelar al final del periodo'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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

            <AlertDialog open={cancelPayPalOpen} onOpenChange={setCancelPayPalOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cancelar suscripción PayPal?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se enviará la cancelación a PayPal. Si tienes dudas, revisa también el centro de PayPal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={cancelPayPalBusy}>Volver</AlertDialogCancel>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={cancelPayPalBusy}
                    onClick={() => void cancelPayPalSubscription()}
                  >
                    {cancelPayPalBusy ? 'Procesando…' : 'Sí, cancelar'}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManagementSection;
