import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SubscriptionManagementSection from '@/components/SubscriptionManagementSection';
import { useAuth } from '@/contexts/AuthContext';
import { apiJson } from '@/lib/api';
import { Headphones, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type PaymentRow = {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  provider: 'stripe' | 'paypal';
  status: string;
  tier: string;
};

const tierLabel: Record<string, string> = {
  monthly: 'Mensual',
  semester: 'Semestral',
  annual: 'Anual',
  free: 'Gratuito',
};

const statusLabel: Record<string, string> = {
  completed: 'Completado',
  pending: 'Pendiente',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

function formatMoney(amountCents: number, currency: string): string {
  const code = currency.toUpperCase();
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: code === 'MXN' ? 'MXN' : code,
    }).format(amountCents / 100);
  } catch {
    return `${(amountCents / 100).toFixed(2)} ${code}`;
  }
}

const Soporte = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[] | null>(null);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState(false);
  const [receiptBusyId, setReceiptBusyId] = useState<string | null>(null);

  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL as string | undefined;

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const json = await apiJson<{ data: { payments: PaymentRow[] } }>('/api/payments/history');
        if (!c) setPayments(json.data.payments);
      } catch {
        if (!c) {
          setPaymentsError(true);
          toast.error('No se pudo cargar el historial de pagos');
        }
      } finally {
        if (!c) setLoadingPayments(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const openReceipt = async (paymentId: string) => {
    setReceiptBusyId(paymentId);
    try {
      const json = await apiJson<{ data: { url: string } }>(`/api/payments/${paymentId}/receipt`);
      window.open(json.data.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'No hay recibo disponible para este pago');
    } finally {
      setReceiptBusyId(null);
    }
  };

  const hasActiveRecurring =
    !!user?.hasStripeSubscription || !!user?.hasPayPalSubscription;

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 mb-2">
          <Headphones className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Soporte</h1>
        </div>
        <p className="text-muted-foreground">
          Gestiona tu suscripción, consulta tus pagos y encuentra ayuda cuando la necesites.
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Historial de pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPayments ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </p>
          ) : paymentsError ? (
            <p className="text-sm text-muted-foreground">No se pudo cargar el historial. Intenta de nuevo más tarde.</p>
          ) : !payments?.length ? (
            <p className="text-sm text-muted-foreground">Aún no hay pagos registrados en tu cuenta.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Recibo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>{formatMoney(p.amount, p.currency)}</TableCell>
                      <TableCell>{tierLabel[p.tier] ?? p.tier}</TableCell>
                      <TableCell className="capitalize">{p.provider}</TableCell>
                      <TableCell>{statusLabel[p.status] ?? p.status}</TableCell>
                      <TableCell className="text-right">
                        {p.provider === 'stripe' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            disabled={receiptBusyId === p.id}
                            onClick={() => void openReceipt(p.id)}
                          >
                            {receiptBusyId === p.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                Ver recibo <ExternalLink className="w-3 h-3" />
                              </>
                            )}
                          </Button>
                        ) : (
                          <a
                            href="https://www.paypal.com/activity"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary inline-flex items-center gap-1 hover:underline"
                          >
                            Actividad PayPal <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Suscripción</h2>
        <SubscriptionManagementSection />
        {!hasActiveRecurring && (
          <p className="text-sm text-muted-foreground">
            No tienes una suscripción recurrente activa.{' '}
            <Link to="/dashboard/subscription" className="text-primary font-medium hover:underline">
              Ver planes
            </Link>
          </p>
        )}
      </section>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Ayuda y contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Consulta las{' '}
            <Link to="/terminos" className="text-primary hover:underline">
              condiciones del servicio
            </Link>{' '}
            y la{' '}
            <Link to="/privacidad" className="text-primary hover:underline">
              política de privacidad
            </Link>
            .
          </p>
          {supportEmail ? (
            <p>
              ¿Necesitas ayuda? Escríbenos a{' '}
              <a href={`mailto:${supportEmail}`} className="text-primary font-medium hover:underline">
                {supportEmail}
              </a>
              .
            </p>
          ) : (
            <p>Si necesitas ayuda adicional, utiliza los datos de contacto indicados en los términos del servicio.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Soporte;
