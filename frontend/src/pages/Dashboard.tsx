import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, Flame, TrendingUp, Plus, Clock, ArrowRight, Play, Lock, Crown } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import MotivationalBanner from '@/components/MotivationalBanner';
import CountdownTimer from '@/components/CountdownTimer';
import { apiJson } from '@/lib/api';
import type {
  DashboardExamDate,
  ExamConfig,
  ExamStatus,
  MotivationalPhrase,
  StudyPlan,
  StudyPlanImpact,
  UserStats,
} from '@/types';

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

const emptyStats: UserStats = {
  totalExams: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  accuracyPercent: 0,
  studyStreak: 0,
  byCategory: [],
  weeklyProgress: [],
  prediction: null,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { isFreeUser } = useUser();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<ListExam[]>([]);
  const [stats, setStats] = useState<UserStats>(emptyStats);
  const [phrases, setPhrases] = useState<MotivationalPhrase[]>([]);
  const [activeExamDate, setActiveExamDate] = useState<DashboardExamDate | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [studyPlanImpact, setStudyPlanImpact] = useState<StudyPlanImpact | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [examsSettled, bannerSettled] = await Promise.allSettled([
        apiJson<{ data: ListExam[] }>('/api/exams?page=1&limit=100'),
        apiJson<{ data: { phrases: MotivationalPhrase[]; activeExamDate: DashboardExamDate | null } }>(
          '/api/content/banner'
        ),
      ]);
      if (!cancelled) {
        if (examsSettled.status === 'fulfilled') setExams(examsSettled.value.data);
        else setExams([]);
        if (bannerSettled.status === 'fulfilled') {
          setPhrases(bannerSettled.value.data.phrases);
          setActiveExamDate(bannerSettled.value.data.activeExamDate);
        } else {
          setPhrases([]);
          setActiveExamDate(null);
        }
      }
      try {
        const [statsJson, planJson, impactJson] = await Promise.all([
          !isFreeUser ? apiJson<{ data: UserStats }>('/api/stats') : Promise.resolve(null),
          apiJson<{ data: StudyPlan | null }>('/api/study-plan/today').catch(() => null),
          apiJson<{ data: StudyPlanImpact }>('/api/study-plan/impact').catch(() => null),
        ]);
        if (!cancelled) {
          setStats(statsJson?.data ?? emptyStats);
          setStudyPlan(planJson?.data ?? null);
          setStudyPlanImpact(impactJson?.data ?? null);
        }
      } catch {
        if (!cancelled) setStats(emptyStats);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isFreeUser]);

  const inProgress = exams.filter((e) => e.status === 'in_progress' || e.status === 'not_started');
  const completed = exams.filter((e) => e.status === 'completed');
  const lastExam =
    inProgress.length > 0
      ? [...inProgress].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
      : null;

  const greetingName = user?.firstName?.trim();
  const greeting = greetingName ? `¡Hola, ${greetingName}!` : '¡Hola!';

  if (loading) {
    return <div className="max-w-7xl mx-auto p-6 text-muted-foreground">Cargando…</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <MotivationalBanner phrases={phrases} />
      <div data-tour="countdown">
        <CountdownTimer activeExamDate={activeExamDate} />
      </div>

      {isFreeUser && (
        <Card className="border-2 border-warning/30 bg-warning/5 shadow-md">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Estás en la versión gratuita</p>
                <p className="text-sm text-muted-foreground">Exámenes limitados a 10 preguntas. Suscríbete para acceso completo.</p>
              </div>
            </div>
            <Button className="gradient-primary border-0 font-semibold gap-2 flex-shrink-0" onClick={() => navigate('/dashboard/subscription')}>
              <Crown className="w-4 h-4" /> Suscribirme
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{greeting} 👋</h1>
          <p className="text-muted-foreground mt-1">Continúa tu preparación para el ENARM</p>
        </div>
        <Button className="gradient-primary border-0 font-semibold gap-2 h-12 px-6" onClick={() => navigate('/dashboard/new-exam')}>
          <Plus className="w-5 h-5" /> Nuevo Examen
        </Button>
      </div>

      {lastExam && (() => {
        const progress = Math.round((lastExam.currentQuestionIndex / Math.max(1, lastExam.config.questionCount)) * 100);
        const timeAgo = getTimeAgo(lastExam.startedAt);
        return (
          <Card
            className="border-0 shadow-xl overflow-hidden cursor-pointer group"
            onClick={() => navigate(`/exam/${lastExam.id}/${lastExam.config.mode}`)}
          >
            <div className="gradient-hero p-6 lg:p-8 relative">
              <div className="absolute inset-0 opacity-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white/20" style={{ width: `${60 + i * 30}px`, height: `${60 + i * 30}px`, top: `${10 + i * 10}%`, right: `${-2 + i * 5}%` }} />
                ))}
              </div>
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-1">
                  <p className="text-white/70 text-sm font-medium mb-1">Continúa donde te quedaste</p>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{lastExam.config.categories.join(', ')}</h2>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      {lastExam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}
                    </Badge>
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {Math.round(lastExam.timeSpentSeconds / 60)} min · {timeAgo}
                    </span>
                  </div>
                  <div className="max-w-md">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>{lastExam.currentQuestionIndex} de {lastExam.config.questionCount} preguntas</span>
                      <span className="font-bold text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div className="h-3 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold gap-2 h-14 px-8 text-base shadow-lg group-hover:scale-105 transition-transform"
                >
                  <Play className="w-5 h-5" /> Continuar examen
                </Button>
              </div>
            </div>
          </Card>
        );
      })()}

      <div className="relative">
        {isFreeUser && (
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3">
            <Lock className="w-8 h-8 text-muted-foreground" />
            <p className="font-semibold text-foreground">Estadísticas bloqueadas</p>
            <Button size="sm" className="gradient-primary border-0 gap-2" onClick={() => navigate('/dashboard/subscription')}>
              <Crown className="w-4 h-4" /> Desbloquear
            </Button>
          </div>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${isFreeUser ? 'pointer-events-none' : ''}`}>
          {[
            { label: 'Preguntas', value: stats.totalQuestions.toLocaleString(), icon: BookOpen, color: 'text-primary' },
            { label: 'Aciertos', value: `${stats.accuracyPercent}%`, icon: Target, color: 'text-success' },
            { label: 'Racha', value: `${stats.studyStreak} días`, icon: Flame, color: 'text-warning' },
            { label: 'Exámenes', value: stats.totalExams.toString(), icon: TrendingUp, color: 'text-secondary' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {!isFreeUser && stats.prediction && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Prediccion de plaza ({stats.prediction.specialty})</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(stats.prediction.placementProbability)}% probabilidad · P{Math.round(stats.prediction.estimatedPercentile)}
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate(`/results/${stats.prediction?.examId}`)}>
              Ver ultimo simulador
            </Button>
          </CardContent>
        </Card>
      )}

      {studyPlan && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Tu plan de hoy</p>
                <p className="text-xl font-bold text-foreground">
                  {studyPlan.targetMinutes} min · {studyPlan.completionPercent}% completado
                </p>
              </div>
              {studyPlan.isFreeLimited && (
                <Badge variant="outline" className="text-warning border-warning/40">
                  Version limitada
                </Badge>
              )}
            </div>
            <Progress value={studyPlan.completionPercent} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {studyPlan.tasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-3">
                  <p className="font-medium text-sm text-foreground">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.completedCount}/{task.targetCount}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Si completas 14 dias: +{studyPlan.estimatedImpact14Days.scoreDelta} puntos y +{studyPlan.estimatedImpact14Days.percentileDelta} percentil (estimado)
              </p>
              {studyPlan.isFreeLimited ? (
                <Button size="sm" onClick={() => navigate('/dashboard/subscription')}>
                  Desbloquear completo
                </Button>
              ) : null}
            </div>
            {studyPlanImpact ? (
              <p className="text-xs text-muted-foreground">
                Ultimos 14 dias: {studyPlanImpact.last14Days.completedPlans}/{studyPlanImpact.last14Days.totalPlans} planes completados.
              </p>
            ) : null}
          </CardContent>
        </Card>
      )}

      {inProgress.length > 1 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Otros exámenes en curso ({inProgress.length - 1})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.filter((e) => e.id !== lastExam?.id).map((exam) => {
              const progress = Math.round((exam.currentQuestionIndex / Math.max(1, exam.config.questionCount)) * 100);
              return (
                <Card key={exam.id} className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(`/exam/${exam.id}/${exam.config.mode}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-accent text-accent-foreground">
                        {exam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Math.round(exam.timeSpentSeconds / 60)} min
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{exam.config.categories.join(', ')}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{exam.config.subcategories.join(', ')}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{exam.currentQuestionIndex}/{exam.config.questionCount} preguntas</span>
                        <span className="font-medium text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="mt-3 flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Continuar <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Historial de exámenes</h2>
        {completed.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-2">
            <p className="text-sm text-muted-foreground">Aún no has completado exámenes.</p>
            <Button variant="outline" size="sm" className="w-fit" onClick={() => navigate('/dashboard/new-exam')}>
              <Plus className="w-4 h-4 mr-1" /> Nuevo examen
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.map((exam) => (
              <Card key={exam.id} className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/results/${exam.id}`)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">{exam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(exam.startedAt).toLocaleDateString('es-MX')}</span>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{exam.config.categories.join(', ')}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{exam.config.questionCount} preguntas</p>
                  <div className="flex items-center gap-2">
                    <div className={`text-3xl font-bold ${(exam.score ?? 0) >= 70 ? 'text-success' : 'text-destructive'}`}>
                      {exam.score != null ? `${Math.round(exam.score)}%` : '—'}
                    </div>
                    <span className="text-sm text-muted-foreground">calificación</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'hace unos minutos';
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days > 1 ? 's' : ''}`;
}

export default Dashboard;
