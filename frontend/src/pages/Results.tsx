import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Trophy,
  BarChart3,
  Home,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Share2,
  MessageCircle,
  Facebook,
  Instagram,
  Star,
  ClipboardCheck,
} from 'lucide-react';
import type { Exam, StudyPlan, UserStats } from '@/types';
import { RichOrPlainBlock } from '@/components/RichOrPlainBlock';
import { apiJson } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  buildPlatformUrl,
  buildPredictionShareText,
  buildResultShareText,
  copyText,
  generateShareImage,
  openShareUrl,
  shareImageOrDownload,
  shareWithFallback,
  type SharePlatform,
} from '@/utils/share';

const Results = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { isFreeTrialExhausted } = useUser();
  const { refreshUser } = useAuth();
  const [exam, setExam] = useState<Exam | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<{ active: boolean; label: string; progress: number }>({
    active: false,
    label: '',
    progress: 0,
  });
  const shareTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current != null) {
        window.clearInterval(shareTimerRef.current);
        shareTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!examId) return;
    let c = false;
    (async () => {
      try {
        const [examRes, statsRes] = await Promise.all([
          apiJson<{ data: Exam }>(`/api/exams/${examId}/results`),
          apiJson<{ data: UserStats }>('/api/stats').catch(() => null),
        ]);
        const studyRes = await apiJson<{ data: StudyPlan | null }>('/api/study-plan/today').catch(() => null);
        if (!c) {
          setExam(examRes.data);
          if (statsRes) setStats(statsRes.data);
          setStudyPlan(studyRes?.data ?? null);
          void refreshUser();
        }
      } catch (e) {
        if (!c) setErr(e instanceof Error ? e.message : 'Error');
      }
    })();
    return () => {
      c = true;
    };
  }, [examId]);

  if (err) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive">{err}</p>
        <Button onClick={() => navigate('/dashboard/exams')}>Volver a exámenes</Button>
      </div>
    );
  }

  if (!exam || !exam.flatQuestions?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando resultados…
      </div>
    );
  }

  const score = exam.score != null ? Math.round(exam.score) : 0;
  const flat = exam.flatQuestions;
  const byQ = new Map(exam.answers.map((a) => [a.questionId, a]));

  let correct = 0;
  let totalAnswered = 0;
  for (const q of flat) {
    const a = byQ.get(q.id);
    if (a?.selectedOptionId) {
      totalAnswered++;
      if (a.isCorrect) correct++;
    }
  }

  const byCategory = stats?.byCategory ?? [];
  const prediction = exam.prediction ?? stats?.prediction ?? null;
  const examUrl = typeof window !== 'undefined' ? `${window.location.origin}/results/${exam.id}` : undefined;

  const resultText = buildResultShareText({
    score,
    correct,
    totalAnswered,
    examUrl,
  });

  const predictionText = prediction
    ? buildPredictionShareText({
        specialty: prediction.specialty,
        placementProbability: prediction.placementProbability,
        estimatedPercentile: prediction.estimatedPercentile,
        examUrl,
      })
    : '';

  const shareToPlatform = async (platform: SharePlatform, text: string) => {
    startShareProgress(platform === 'instagram' ? 'Preparando imagen para compartir...' : 'Abriendo opcion de compartir...');
    try {
      if (platform === 'instagram') {
        await copyText(text);
        const image = await generateShareImage({
          title: 'Resultado ENARM',
          subtitle: prediction ? `Prediccion: ${prediction.specialty}` : 'Nuevo simulador completado',
          highlightA: `${score}% calificacion`,
          highlightB: prediction
            ? `${Math.round(prediction.placementProbability)}% probabilidad`
            : `${correct}/${totalAnswered} correctas`,
          footer: 'Texto copiado. Ahora comparte la imagen en Instagram.',
        });
        await shareImageOrDownload(image, `resultado-enarm-${exam.id}.png`, text);
        finishShareProgress();
        toast.success('Imagen lista para Instagram y texto copiado');
        return;
      }
      const shareUrl = buildPlatformUrl(platform, text, examUrl);
      if (!shareUrl) {
        failShareProgress();
        return;
      }
      openShareUrl(shareUrl);
      finishShareProgress();
    } catch (error) {
      failShareProgress();
      toast.error(error instanceof Error ? error.message : 'No se pudo compartir');
    }
  };

  const handleQuickShare = async (text: string, label: string) => {
    startShareProgress(`Compartiendo ${label.toLowerCase()}...`);
    try {
      const method = await shareWithFallback('Case Study Mentor', text, examUrl);
      finishShareProgress();
      if (method === 'native') toast.success(`${label} compartido`);
      else toast.success(`${label} copiado al portapapeles`);
    } catch (error) {
      failShareProgress();
      toast.error(error instanceof Error ? error.message : 'No se pudo compartir');
    }
  };

  const clearShareTimer = () => {
    if (shareTimerRef.current != null) {
      window.clearInterval(shareTimerRef.current);
      shareTimerRef.current = null;
    }
  };

  const startShareProgress = (label: string) => {
    clearShareTimer();
    setShareStatus({ active: true, label, progress: 18 });
    shareTimerRef.current = window.setInterval(() => {
      setShareStatus((prev) => {
        if (!prev.active) return prev;
        const next = Math.min(prev.progress + 14, 92);
        return { ...prev, progress: next };
      });
    }, 180);
  };

  const finishShareProgress = () => {
    clearShareTimer();
    setShareStatus((prev) => ({ ...prev, progress: 100 }));
    window.setTimeout(() => {
      setShareStatus({ active: false, label: '', progress: 0 });
    }, 450);
  };

  const failShareProgress = () => {
    clearShareTimer();
    setShareStatus({ active: false, label: '', progress: 0 });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="gradient-hero p-8 text-center text-white">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-5xl font-bold mb-2">{score}%</h1>
            <p className="text-xl text-white/80">Tu calificación</p>
            <div className="flex justify-center gap-8 mt-6 text-sm text-white/70">
              <div>
                <span className="text-2xl font-bold text-white block">{correct}</span>Correctas
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">{totalAnswered - correct}</span>Incorrectas
              </div>
              <div>
                <span className="text-2xl font-bold text-white block">{totalAnswered}</span>Contestadas
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button size="sm" variant="secondary" className="gap-2" onClick={() => handleQuickShare(resultText, 'Resultado')}>
                <Share2 className="w-4 h-4" /> Compartir resultado
              </Button>
              <Button size="sm" variant="secondary" className="gap-2" onClick={() => shareToPlatform('whatsapp', resultText)}>
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </Button>
              <Button size="sm" variant="secondary" className="gap-2" onClick={() => shareToPlatform('facebook', resultText)}>
                <Facebook className="w-4 h-4" /> Facebook
              </Button>
              <Button size="sm" variant="secondary" className="gap-2" onClick={() => shareToPlatform('instagram', resultText)}>
                <Instagram className="w-4 h-4" /> Instagram
              </Button>
            </div>
            {shareStatus.active && (
              <div className="mt-4 max-w-md mx-auto rounded-lg bg-white/15 backdrop-blur-sm border border-white/30 p-3 text-left">
                <p className="text-xs text-white/90 mb-2">{shareStatus.label}</p>
                <Progress value={shareStatus.progress} className="h-2 bg-white/20" />
              </div>
            )}
          </div>
        </Card>

        {exam.mentorReview && (
          <Card className="border-0 shadow-md border-l-4 border-l-secondary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardCheck className="w-5 h-5 text-secondary" />
                Retroalimentación del equipo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-1" aria-label={`Valoración ${exam.mentorReview.rating} de 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${i < exam.mentorReview.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
                  />
                ))}
              </div>
              {exam.mentorReview.comment ? (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{exam.mentorReview.comment}</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                Revisado el{' '}
                {new Date(exam.mentorReview.reviewedAt).toLocaleString('es-MX', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </p>
            </CardContent>
          </Card>
        )}

        {byCategory.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Desglose global por especialidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {byCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-foreground">{cat.category}</span>
                    <span className={`font-bold ${cat.percent >= 70 ? 'text-success' : 'text-destructive'}`}>
                      {cat.percent}%
                    </span>
                  </div>
                  <Progress value={cat.percent} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {prediction && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Prediccion ENARM para {prediction.specialty}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Probabilidad de plaza</p>
                  <p className="text-2xl font-bold text-foreground">{Math.round(prediction.placementProbability)}%</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Percentil estimado</p>
                  <p className="text-2xl font-bold text-foreground">P{Math.round(prediction.estimatedPercentile)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Estimacion basada en tu desempeno actual y tendencia reciente. Version: {prediction.version}
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={() => handleQuickShare(predictionText, 'Prediccion')}>
                  <Share2 className="w-4 h-4" /> Compartir prediccion
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => shareToPlatform('whatsapp', predictionText)}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => shareToPlatform('facebook', predictionText)}>
                  <Facebook className="w-4 h-4" /> Facebook
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => shareToPlatform('instagram', predictionText)}>
                  <Instagram className="w-4 h-4" /> Instagram
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {studyPlan && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Plan sugerido para hoy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Duracion objetivo: {studyPlan.targetMinutes} min. Si sostienes este ritmo 14 dias, podrias mejorar +{studyPlan.estimatedImpact14Days.scoreDelta} puntos y +{studyPlan.estimatedImpact14Days.percentileDelta} percentil.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {studyPlan.tasks.map((task) => (
                  <div key={task.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.targetCount} objetivos</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => navigate('/dashboard/study-plan')}>
                Iniciar plan ahora
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Revisión de preguntas</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Toca una pregunta para verla en el examen con tu respuesta y el feedback.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {flat.map((q) => {
              const a = byQ.get(q.id);
              const isCorrect = a?.isCorrect === true;
              const answered = a?.selectedOptionId != null;
              const fmt = q.caseTextFormat ?? 'plain';
              const openInExam = () => {
                navigate(`/exam/${exam.id}/study?questionId=${encodeURIComponent(q.id)}`);
              };
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={openInExam}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openInExam();
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    !answered
                      ? 'border-muted'
                      : isCorrect
                        ? 'border-success/30 bg-success/5'
                        : 'border-destructive/30 bg-destructive/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        !answered
                          ? 'bg-muted text-muted-foreground'
                          : isCorrect
                            ? 'bg-success text-success-foreground'
                            : 'bg-destructive text-destructive-foreground'
                      }`}
                    >
                      {answered ? isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" /> : '?'}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium text-foreground/80">Especialidad:</span> {q.specialty}
                        {' · '}
                        <span className="font-medium text-foreground/80">Subespecialidad:</span> {q.area}
                        {' · '}
                        <span className="font-medium text-foreground/80">Tema:</span> {q.topic}
                      </p>
                      <div className="text-sm">
                        <RichOrPlainBlock format={fmt} text={q.text} className="font-medium text-foreground" />
                      </div>
                      {answered && (
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <p>Respuesta correcta:</p>
                          <RichOrPlainBlock
                            format={fmt}
                            text={q.options.find((o) => o.isCorrect)?.text ?? ''}
                            className="text-success font-medium"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/dashboard')}>
            <Home className="w-4 h-4" /> Ir al Dashboard
          </Button>
          <Button
            className="gradient-primary border-0 gap-2"
            onClick={() =>
              isFreeTrialExhausted ? navigate('/dashboard/subscription') : navigate('/dashboard/new-exam')
            }
          >
            <RotateCcw className="w-4 h-4" /> {isFreeTrialExhausted ? 'Suscribirme' : 'Nuevo examen'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
