import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { apiJson } from '@/lib/api';
import type { StudyPlan } from '@/types';
import { RichOrPlainBlock } from '@/components/RichOrPlainBlock';

const StudyPlanSession = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashMastered, setFlashMastered] = useState(0);
  const [miniCaseCorrect, setMiniCaseCorrect] = useState(false);
  const [miniCaseSelectedOptionId, setMiniCaseSelectedOptionId] = useState<string | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});

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
  const answeredQuestions = questionItems.filter((q) => questionAnswers[q.id]).length;
  const correctQuestions = questionItems.filter((q) => {
    const selectedOptionId = questionAnswers[q.id];
    if (!selectedOptionId) return false;
    return (q.options ?? []).some((o) => o.id === selectedOptionId && o.isCorrect);
  }).length;

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
    setActiveQuestionId(null);
    setQuestionAnswers({});
  }

  useEffect(() => {
    if (questionItems.length > 0 && !activeQuestionId) {
      setActiveQuestionId(questionItems[0].id);
    }
  }, [activeQuestionId, questionItems]);

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
          <p className="text-sm text-muted-foreground">
            Este plan toma tu rendimiento reciente (aciertos, errores y temas con menor dominio) y prioriza lo que mas impacto
            puede tener en tu puntaje ENARM de forma practica para hoy.
          </p>
          <Progress value={completion} className="h-2" />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Como usar esta sesion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {questionTask && questionItems.length > 0 ? (
            <div className="rounded-lg border p-3">
              <p className="font-medium">1) Bloque de preguntas</p>
              <p className="text-muted-foreground">
                Se conforma con preguntas de tus areas mas debiles y temas de alto peso. Te ayuda a practicar decision clinica
                y detectar huecos puntuales antes del siguiente simulador.
              </p>
            </div>
          ) : null}
          {flashTask && flashcards.length > 0 ? (
            <div className="rounded-lg border p-3">
              <p className="font-medium">2) Flashcards</p>
              <p className="text-muted-foreground">
                Refuerzan memoria activa de conceptos clave que sueles fallar o tardas mas en recordar.
              </p>
            </div>
          ) : null}
          {miniCaseTask && miniCase ? (
            <div className="rounded-lg border p-3">
              <p className="font-medium">3) Mini-caso clinico</p>
              <p className="text-muted-foreground">
                Integra razonamiento clinico completo (contexto + decision). Recibes retroalimentacion inmediata para corregir
                criterio diagnostico/terapeutico.
              </p>
            </div>
          ) : null}
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
            <CardTitle className="flex items-center justify-between">
              Bloque de preguntas recomendado
              <Badge variant="outline">{answeredQuestions}/{questionItems.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {questionItems.map((q) => {
              const selectedOptionId = questionAnswers[q.id];
              const selectedOption = (q.options ?? []).find((o) => o.id === selectedOptionId);
              const isOpen = activeQuestionId === q.id;
              const qFmt = q.textFormat ?? 'plain';
              return (
                <div key={q.id} className="rounded-lg border p-3 space-y-3">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setActiveQuestionId((prev) => (prev === q.id ? null : q.id))}
                  >
                    <p className="text-xs text-muted-foreground">{q.specialty} · {q.area} · {q.topic}</p>
                    <RichOrPlainBlock format={qFmt} text={q.text} className="text-sm font-medium" />
                  </button>

                  {isOpen && (
                    <div className="space-y-2">
                      {(q.options ?? []).map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className={`w-full text-left border rounded-lg p-3 transition-colors ${
                            selectedOptionId === o.id
                              ? o.isCorrect
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                              : selectedOptionId && o.isCorrect
                                ? 'border-green-500'
                                : 'border-border'
                          }`}
                          onClick={() => setQuestionAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                        >
                          <span className="font-medium">{o.label}. </span>
                          <RichOrPlainBlock format={qFmt} text={o.text} className="inline-block w-full text-left" />
                        </button>
                      ))}
                      {selectedOption ? (
                        <div
                          className={`rounded-lg border p-3 text-sm ${
                            selectedOption.isCorrect
                              ? 'border-green-500/40 bg-green-50 text-green-800'
                              : 'border-red-500/40 bg-red-50 text-red-800'
                          }`}
                        >
                          <p className="mb-1">{selectedOption.isCorrect ? 'Correcto.' : 'Incorrecto.'}</p>
                          <RichOrPlainBlock
                            format={qFmt}
                            text={selectedOption.explanation || q.hint || 'Revisa los datos clinicos clave para responder.'}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Selecciona una respuesta para ver retroalimentacion.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <Button
              disabled={questionItems.length === 0 || answeredQuestions < questionItems.length}
              onClick={() =>
                completeTask(
                  questionTask.id,
                  questionTask.targetCount,
                  Math.round((correctQuestions / Math.max(1, questionItems.length)) * 100)
                )
              }
            >
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
              <RichOrPlainBlock format={miniCase.textFormat ?? 'plain'} text={miniCase.text} />
            </div>
            {miniCase.question ? (
              <div className="space-y-2">
                <RichOrPlainBlock
                  format={miniCase.textFormat ?? 'plain'}
                  text={miniCase.question.text}
                  className="font-medium"
                />
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
                    <span className="font-medium">{o.label}. </span>
                    <RichOrPlainBlock
                      format={miniCase.textFormat ?? 'plain'}
                      text={o.text}
                      className="inline-block w-full text-left"
                    />
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
                    <p className="mb-1">{selectedMiniCaseOption.isCorrect ? 'Correcto.' : 'Incorrecto.'}</p>
                    <RichOrPlainBlock
                      format={miniCase.textFormat ?? 'plain'}
                      text={
                        selectedMiniCaseOption.explanation || 'Revisa la fisiopatologia y criterios diagnosticos del caso.'
                      }
                    />
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
