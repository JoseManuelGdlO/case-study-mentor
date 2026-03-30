import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, BarChart3, Home, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import type { Exam, UserStats } from '@/types';
import { apiJson } from '@/lib/api';

const Results = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;
    let c = false;
    (async () => {
      try {
        const [examRes, statsRes] = await Promise.all([
          apiJson<{ data: Exam }>(`/api/exams/${examId}/results`),
          apiJson<{ data: UserStats }>('/api/stats').catch(() => null),
        ]);
        if (!c) {
          setExam(examRes.data);
          if (statsRes) setStats(statsRes.data);
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
          </div>
        </Card>

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

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Revisión de preguntas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {flat.map((q) => {
              const a = byQ.get(q.id);
              const isCorrect = a?.isCorrect === true;
              const answered = a?.selectedOptionId != null;
              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border-2 ${
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
                      <p className="font-medium text-foreground text-sm">{q.text}</p>
                      {answered && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Respuesta correcta:{' '}
                          <strong className="text-success">{q.options.find((o) => o.isCorrect)?.text}</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/dashboard')}>
            <Home className="w-4 h-4" /> Ir al Dashboard
          </Button>
          <Button className="gradient-primary border-0 gap-2" onClick={() => navigate('/dashboard/new-exam')}>
            <RotateCcw className="w-4 h-4" /> Nuevo examen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
