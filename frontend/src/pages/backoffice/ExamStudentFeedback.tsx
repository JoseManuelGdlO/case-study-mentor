import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquareHeart, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '@/lib/api';

type FeedbackDifficulty = 'easy' | 'medium' | 'hard';

type ExamStudentFeedbackRow = {
  id: string;
  createdAt: string;
  difficulty: FeedbackDifficulty;
  rating: number;
  comment: string | null;
  userEmail: string;
  userName: string;
  examId: string;
  examScore: number | null;
  examCompletedAt: string | null;
};

type FeedbackSummary = {
  total: number;
  withComment: number;
  avgRating: number;
  byDifficulty: Record<FeedbackDifficulty, number>;
};

const difficultyLabel: Record<FeedbackDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Medio',
  hard: 'Difícil',
};

const difficultyBadgeClass: Record<FeedbackDifficulty, string> = {
  easy: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  hard: 'bg-rose-500/10 text-rose-700 border-rose-500/30',
};

const ExamStudentFeedback = () => {
  const [items, setItems] = useState<ExamStudentFeedbackRow[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary>({
    total: 0,
    withComment: 0,
    avgRating: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await apiJson<{ data: { summary: FeedbackSummary; items: ExamStudentFeedbackRow[] } }>(
          '/api/backoffice/exam-student-feedback'
        );
        if (!cancelled) {
          setSummary(json.data.summary);
          setItems(json.data.items);
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'No se pudo cargar el feedback de exámenes');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const commentRate = useMemo(() => {
    if (summary.total === 0) return 0;
    return Math.round((summary.withComment / summary.total) * 100);
  }, [summary.total, summary.withComment]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquareHeart className="w-7 h-7 text-primary" />
          Feedback de preguntas (estudiantes)
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Opiniones opcionales que dejan al terminar examen para evaluar dificultad y calidad de preguntas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total feedbacks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Promedio de calificación</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center gap-2">
              {summary.avgRating.toFixed(2)}
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Con comentario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.withComment}</p>
            <p className="text-xs text-muted-foreground">{commentRate}% del total</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Distribución por dificultad percibida</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline" className={difficultyBadgeClass.easy}>
            Fácil: {summary.byDifficulty.easy}
          </Badge>
          <Badge variant="outline" className={difficultyBadgeClass.medium}>
            Medio: {summary.byDifficulty.medium}
          </Badge>
          <Badge variant="outline" className={difficultyBadgeClass.hard}>
            Difícil: {summary.byDifficulty.hard}
          </Badge>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Últimas opiniones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
            </p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay feedback de estudiantes.</p>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nivel</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comentario</TableHead>
                    <TableHead>Examen</TableHead>
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
                      <TableCell>
                        <Badge variant="outline" className={difficultyBadgeClass[row.difficulty]}>
                          {difficultyLabel[row.difficulty]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{row.rating}</span>
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-md">
                        {row.comment?.trim() ? row.comment : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div>ID: {row.examId.slice(0, 8)}…</div>
                        <div>Puntaje: {row.examScore != null ? `${Math.round(row.examScore)}%` : '—'}</div>
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

export default ExamStudentFeedback;
