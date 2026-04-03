import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

type PendingRow = {
  id: string;
  mode: string;
  score: number | null;
  questionCount: number;
  completedAt: string | null;
  user: { email: string; firstName: string; lastName: string };
};

const ExamReviews = () => {
  const [rows, setRows] = useState<PendingRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const json = await apiJson<{
        data: { data: PendingRow[]; total: number; page: number; totalPages: number };
      }>(`/api/backoffice/exam-reviews?page=${page}&limit=${limit}`);
      setRows(json.data.data);
      setTotalPages(Math.max(1, json.data.totalPages));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al cargar revisiones');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <ClipboardCheck className="w-7 h-7 text-primary" />
          Revisiones de examenes
        </h1>
        <p className="text-muted-foreground mt-1">
          Muestra aleatoria (~20%) de examenes completados pendientes de calificar y comentar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Cargando…</p>
          ) : rows.length === 0 ? (
            <p className="text-muted-foreground">No hay examenes en cola.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Modo</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Preguntas</TableHead>
                  <TableHead>Completado</TableHead>
                  <TableHead className="text-right">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.user.firstName} {r.user.lastName}</div>
                      <div className="text-xs text-muted-foreground">{r.user.email}</div>
                    </TableCell>
                    <TableCell className="capitalize">{r.mode}</TableCell>
                    <TableCell>{r.score != null ? `${Math.round(r.score)}%` : '—'}</TableCell>
                    <TableCell>{r.questionCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.completedAt
                        ? new Date(r.completedAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/backoffice/exam-reviews/${r.id}`}>Revisar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExamReviews;
