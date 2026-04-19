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
import { Inbox, Loader2 } from 'lucide-react';

type Row = {
  id: string;
  createdAt: string;
  source: 'modal' | 'mailbox';
  message: string;
  userEmail: string;
  userName: string;
};

const sourceLabel = (s: Row['source']) => (s === 'modal' ? 'Modal' : 'Buzón');

const PlatformSuggestionsAdmin = () => {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const json = await apiJson<{ data: { items: Row[] } }>('/api/backoffice/platform-suggestions');
        if (!c) setItems(json.data.items);
      } catch (e) {
        if (!c) toast.error(e instanceof Error ? e.message : 'No se pudo cargar las sugerencias');
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
          <Inbox className="w-7 h-7 text-primary" />
          Sugerencias de plataforma
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ideas y comentarios enviados desde el modal ocasional o el buzón del menú del estudiante.
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Registros</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay sugerencias registradas.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="whitespace-nowrap">Origen</TableHead>
                    <TableHead>Mensaje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-sm align-top">
                        {new Date(r.createdAt).toLocaleString('es-MX')}
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="font-medium text-foreground">{r.userName}</div>
                        <div className="text-xs text-muted-foreground">{r.userEmail}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap align-top">{sourceLabel(r.source)}</TableCell>
                      <TableCell className="max-w-xl align-top text-sm whitespace-pre-wrap">{r.message}</TableCell>
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

export default PlatformSuggestionsAdmin;
