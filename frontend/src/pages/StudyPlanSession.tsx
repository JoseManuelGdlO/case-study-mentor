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
  const [miniCaseSelectedOptionId, setMiniCaseSelectedOptionId] = useState<string | null>(null);

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
  const questionTask = plan?.tasks.find((t) => t.type === 'question_set');
  const miniCaseTask = plan?.tasks.find((t) => t.type === 'mini_case');
  const questionItems = questionTask?.payload?.questions ?? [];
  const flashcards = flashTask?.payload?.flashcards ?? [];
  const currentFlash = flashcards[flashIdx];
  const miniCase = miniCaseTask?.payload?.cases?.[0];
  const selectedMiniCaseOption = miniCase?.question?.options.find((o) => o.id === miniCaseSelectedOptionId) ?? null;

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

  async function regeneratePlan() {
    const res = await apiJson<{ data: StudyPlan | null }>('/api/study-plan/today/regenerate', {
      method: 'POST',
    });
    setPlan(res.data);
    setFlashIdx(0);
    setFlashMastered(0);
    setMiniCaseCorrect(false);
    setMiniCaseSelectedOptionId(null);
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

      {questionTask && questionItems.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Bloque de preguntas recomendado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {questionItems.slice(0, 8).map((q) => (
              <div key={q.id} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{q.specialty} · {q.area} · {q.topic}</p>
                <p className="text-sm">{q.text}</p>
              </div>
            ))}
            <Button onClick={() => completeTask(questionTask.id, questionTask.targetCount, 100)}>
              Marcar bloque completado
            </Button>
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
                    className={`w-full text-left border rounded-lg p-3 transition-colors ${
                      miniCaseSelectedOptionId === o.id
                        ? o.isCorrect
                          ? 'border-green-500 bg-green-50'
                          : 'border-red-500 bg-red-50'
                        : miniCaseSelectedOptionId && o.isCorrect
                          ? 'border-green-500'
                          : 'border-border'
                    }`}
                    onClick={() => {
                      setMiniCaseSelectedOptionId(o.id);
                      setMiniCaseCorrect(o.isCorrect);
                    }}
                  >
                    {o.label}. {o.text}
                  </button>
                ))}
                {selectedMiniCaseOption ? (
                  <div
                    className={`rounded-lg border p-3 text-sm ${
                      selectedMiniCaseOption.isCorrect
                        ? 'border-green-500/40 bg-green-50 text-green-800'
                        : 'border-red-500/40 bg-red-50 text-red-800'
                    }`}
                  >
                    {selectedMiniCaseOption.isCorrect ? 'Correcto.' : 'Incorrecto.'}{' '}
                    {selectedMiniCaseOption.explanation || 'Revisa la fisiopatologia y criterios diagnosticos del caso.'}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Selecciona una respuesta para ver retroalimentacion.</p>
                )}
              </div>
            ) : null}
            <Button
              disabled={!miniCaseSelectedOptionId}
              onClick={() => completeTask(miniCaseTask.id, 1, miniCaseCorrect ? 100 : 0)}
            >
              Marcar mini-caso completado
            </Button>
          </CardContent>
        </Card>
      )}

      {(!questionItems.length && !flashcards.length && !miniCase) && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-5 space-y-3">
            <p className="text-muted-foreground">
              Tu plan de hoy no tiene contenido disponible para tu combinacion de especialidad/area.
              Puedes regenerarlo o cargar mas contenido en backoffice (flashcards/casos publicados).
            </p>
            <div className="flex gap-2">
              <Button onClick={() => void regeneratePlan()}>Regenerar plan</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>Volver al dashboard</Button>
            </div>
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
