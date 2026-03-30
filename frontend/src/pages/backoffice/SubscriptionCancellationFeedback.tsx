import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';
import { MessageSquareText, Loader2 } from 'lucide-react';
import { cancelReasonLabel } from '@/constants/cancellation-feedback';

type FeedbackRow = {
  id: string;
  createdAt: string;
  provider: 'stripe' | 'paypal';
  reason: string;
  details: string | null;
  userEmail: string;
  userName: string;
};

const SubscriptionCancellationFeedback = () => {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const json = await apiJson<{ data: { items: FeedbackRow[] } }>(
          '/api/backoffice/subscription-cancellation-feedback'
        );
        if (!c) setItems(json.data.items);
      } catch (e) {
        if (!c) toast.error(e instanceof Error ? e.message : 'No se pudo cargar el feedback');
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquareText className="w-7 h-7 text-primary" />
          Cancelaciones de suscripción
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Motivos y comentarios que dejaron los usuarios al cancelar (Stripe o PayPal).
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Últimos registros</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay cancelaciones con feedback registrado.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Comentarios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(row.createdAt).toLocaleString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{row.userName || '—'}</div>
                        <div className="text-xs text-muted-foreground">{row.userEmail}</div>
                      </TableCell>
                      <TableCell className="capitalize text-sm">{row.provider}</TableCell>
                      <TableCell className="text-sm max-w-[220px]">{cancelReasonLabel(row.reason)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {row.details?.trim() ? row.details : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCancellationFeedback;
