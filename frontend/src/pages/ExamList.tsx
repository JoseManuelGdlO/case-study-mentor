import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiJson } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import type { ExamConfig, ExamStatus } from '@/types';

type ListExam = {
  id: string;
  config: ExamConfig;
  status: ExamStatus;
  score: number | null;
  startedAt: string;
  completedAt: string | null;
  timeSpentSeconds: number;
  currentQuestionIndex: number;
};

const ExamList = () => {
  const navigate = useNavigate();
  const { isFreeTrialExhausted } = useUser();
  const [exams, setExams] = useState<ListExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const json = await apiJson<{ data: ListExam[]; total: number }>('/api/exams?page=1&limit=100');
        if (!c) setExams(json.data);
      } catch {
        if (!c) setExams([]);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, []);

  const inProgress = exams.filter((e) => e.status === 'in_progress' || e.status === 'not_started');
  const completed = exams.filter((e) => e.status === 'completed');

  const renderExamCard = (exam: ListExam) => {
    const progress = Math.round((exam.currentQuestionIndex / Math.max(1, exam.config.questionCount)) * 100);
    const isCompleted = exam.status === 'completed';
    return (
      <Card
        key={exam.id}
        className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer"
        onClick={() =>
          isCompleted ? navigate(`/results/${exam.id}`) : navigate(`/exam/${exam.id}/${exam.config.mode}`)
        }
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Badge variant={isCompleted ? 'outline' : 'secondary'} className={!isCompleted ? 'bg-accent text-accent-foreground' : ''}>
              {exam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(exam.startedAt).toLocaleDateString('es-MX')}
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">{exam.config.categories.join(', ')}</h3>
          <p className="text-sm text-muted-foreground mb-3">
            {exam.config.questionCount} preguntas ·{' '}
            {exam.config.language === 'es'
              ? 'Español'
              : exam.config.language === 'en'
                ? 'Inglés'
                : 'Ambas'}
          </p>
          {isCompleted ? (
            <div className={`text-3xl font-bold ${(exam.score ?? 0) >= 70 ? 'text-success' : 'text-destructive'}`}>
              {exam.score != null ? `${exam.score}%` : '—'}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {exam.currentQuestionIndex}/{exam.config.questionCount}
                </span>
                <span className="font-medium text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return <div className="max-w-7xl mx-auto p-4 sm:p-6 text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Exámenes</h1>
          <p className="text-muted-foreground">Todos tus exámenes en un solo lugar</p>
        </div>
        <Button
          className="gradient-primary border-0 font-semibold gap-2 w-full sm:w-auto shrink-0"
          onClick={() =>
            isFreeTrialExhausted ? navigate('/dashboard/subscription') : navigate('/dashboard/new-exam')
          }
        >
          <Plus className="w-4 h-4" /> {isFreeTrialExhausted ? 'Suscribirme' : 'Nuevo Examen'}
        </Button>
      </div>

      <Tabs defaultValue="all">
        <div className="w-full overflow-x-auto pb-1 -mx-0.5 px-0.5">
          <TabsList className="inline-flex h-auto min-h-10 w-max min-w-full flex-wrap justify-center gap-1 sm:flex-nowrap sm:justify-center">
            <TabsTrigger value="all" className="text-xs sm:text-sm shrink-0">
              Todos ({exams.length})
            </TabsTrigger>
            <TabsTrigger value="progress" className="text-xs sm:text-sm shrink-0">
              En curso ({inProgress.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm shrink-0">
              Terminados ({completed.length})
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{exams.map(renderExamCard)}</div>
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{inProgress.map(renderExamCard)}</div>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{completed.map(renderExamCard)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamList;
