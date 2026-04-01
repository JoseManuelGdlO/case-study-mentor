import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiJson } from '@/lib/api';
import type { StudyPlan } from '@/types';

const StudyPlanSession = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashMastered, setFlashMastered] = useState(0);
  const [miniCaseCorrect, setMiniCaseCorrect] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiJson<{ data: StudyPlan | null }>('/api/study-plan/today');
        if (!cancelled) setPlan(res.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const flashTask = plan?.tasks.find((t) => t.type === 'flashcard_set');
  const miniCaseTask = plan?.tasks.find((t) => t.type === 'mini_case');
  const flashcards = flashTask?.payload?.flashcards ?? [];
  const currentFlash = flashcards[flashIdx];
  const miniCase = miniCaseTask?.payload?.cases?.[0];

  const completion = useMemo(() => {
    if (!plan) return 0;
    return plan.completionPercent;
  }, [plan]);

  async function completeTask(taskId: string, completedCount: number, score?: number) {
    if (!plan) return;
    const res = await apiJson<{ data: StudyPlan | null }>(`/api/study-plan/${plan.id}/task/${taskId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completedCount, score, timeSpentSeconds: 300 }),
    });
    setPlan(res.data);
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto text-muted-foreground">Cargando sesion de estudio...</div>;
  }

  if (!plan) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <p className="text-muted-foreground">No hay plan disponible para hoy.</p>
        <Button onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="border-0 shadow-md">
        <CardContent className="p-5 space-y-2">
          <p className="text-sm text-muted-foreground">Sesion de plan diario</p>
          <p className="text-xl font-bold text-foreground">{plan.targetMinutes} min · {completion}% completado</p>
          <Progress value={completion} className="h-2" />
        </CardContent>
      </Card>

      {flashTask && flashcards.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Flashcards
              <Badge variant="outline">{flashIdx + 1}/{flashcards.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentFlash ? (
              <>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-2">Pregunta</p>
                  <p className="font-medium">{currentFlash.question}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-2">Respuesta</p>
                  <p>{currentFlash.answer}</p>
                  {currentFlash.hint ? <p className="text-xs text-muted-foreground mt-2">Pista: {currentFlash.hint}</p> : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (flashIdx < flashcards.length - 1) setFlashIdx((v) => v + 1);
                    }}
                  >
                    No dominada
                  </Button>
                  <Button
                    onClick={() => {
                      setFlashMastered((v) => v + 1);
                      if (flashIdx < flashcards.length - 1) setFlashIdx((v) => v + 1);
                    }}
                  >
                    Dominada
                  </Button>
                  <Button
                    className="ml-auto"
                    onClick={() => completeTask(flashTask.id, flashcards.length, Math.round((flashMastered / Math.max(1, flashcards.length)) * 100))}
                  >
                    Marcar flashcards completas
                  </Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      {miniCaseTask && miniCase && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Mini-caso clinico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">{miniCase.specialty} · {miniCase.area} · {miniCase.topic}</p>
            <div className="rounded-lg border p-4">
              <p>{miniCase.text}</p>
            </div>
            {miniCase.question ? (
              <div className="space-y-2">
                <p className="font-medium">{miniCase.question.text}</p>
                {miniCase.question.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`w-full text-left border rounded-lg p-3 ${miniCaseCorrect && o.isCorrect ? 'border-green-500' : 'border-border'}`}
                    onClick={() => setMiniCaseCorrect(o.isCorrect)}
                  >
                    {o.label}. {o.text}
                  </button>
                ))}
              </div>
            ) : null}
            <Button onClick={() => completeTask(miniCaseTask.id, 1, miniCaseCorrect ? 100 : 0)}>
              Marcar mini-caso completado
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
      </div>
    </div>
  );
};

export default StudyPlanSession;
