import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Exam, ExamFlatQuestion } from '@/types';
import { apiJson } from '@/lib/api';
import { getUploadUrl } from '@/lib/api';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, Lightbulb, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LabResultsAccordion from '@/components/LabResultsAccordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

function enrichFlat(flat: ExamFlatQuestion[]): ExamFlatQuestion[] {
  const counts = new Map<string, number>();
  return flat.map((q) => {
    const n = counts.get(q.caseId) ?? 0;
    counts.set(q.caseId, n + 1);
    const total = flat.filter((f) => f.caseId === q.caseId).length;
    return { ...q, caseQuestionIndex: n, caseQuestionTotal: total };
  });
}

const ExamSimulation = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!examId) return;
    try {
      const json = await apiJson<{ data: Exam }>(`/api/exams/${examId}`);
      setExam(json.data);
      const m: Record<string, string> = {};
      for (const a of json.data.answers) {
        if (a.selectedOptionId) m[a.questionId] = a.selectedOptionId;
      }
      setAnswers((prev) => ({ ...m, ...prev }));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Error');
    }
  }, [examId]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const flat = useMemo(() => enrichFlat(exam?.flatQuestions ?? []), [exam]);
  const question = flat[currentIndex];
  const total = flat.length;

  useEffect(() => {
    setHintOpen(false);
  }, [question?.id]);
  const progress = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;
  const formatTime = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const selectAnswer = async (optionId: string) => {
    if (!examId || !question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    try {
      await apiJson(`/api/exams/${examId}/answer`, {
        method: 'PUT',
        body: JSON.stringify({ questionId: question.id, selectedOptionId: optionId }),
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const finish = async () => {
    if (!examId) return;
    try {
      await apiJson(`/api/exams/${examId}/complete`, {
        method: 'PUT',
        body: JSON.stringify({ timeSpentSeconds: seconds }),
      });
      navigate(`/results/${examId}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al finalizar');
    }
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-destructive">{loadError}</p>
      </div>
    );
  }

  if (!exam || !question || total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Cargando examen…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Badge variant="outline" className="text-base font-mono gap-2">
            <Clock className="w-4 h-4" /> {formatTime(seconds)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Pregunta <strong className="text-foreground">{currentIndex + 1}</strong> de <strong className="text-foreground">{total}</strong>
          </span>
          <Badge variant="secondary" className="text-xs">
            Caso: pregunta {(question.caseQuestionIndex ?? 0) + 1} de {question.caseQuestionTotal ?? 1}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-32 h-2" />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Flag className="w-4 h-4" /> Terminar examen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" /> ¿Terminar examen?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Has contestado {Object.keys(answers).length} de {total} preguntas. Puedes finalizar y ver resultados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Seguir contestando</AlertDialogCancel>
                <AlertDialogAction onClick={finish}>Terminar y ver resultados</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 p-6 max-w-7xl mx-auto w-full">
        <div className="space-y-4">
          <Card className="border-0 shadow-md h-fit">
            <CardContent className="p-6">
              <Badge className="gradient-primary text-primary-foreground border-0 mb-3">{question.specialty}</Badge>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="leading-relaxed">{question.caseText}</p>
              </div>
              {question.caseImageUrl && (
                <img src={getUploadUrl(question.caseImageUrl)} alt="Caso clínico" className="mt-4 rounded-lg max-w-full" />
              )}
            </CardContent>
          </Card>
          <LabResultsAccordion labs={question.labResults} />
        </div>

        <div className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">{question.text}</h2>
              {question.hint?.trim() ? (
                <Collapsible open={hintOpen} onOpenChange={setHintOpen} className="mb-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" type="button" className="gap-2 w-full sm:w-auto">
                      <Lightbulb className="w-4 h-4" />
                      {hintOpen ? 'Ocultar pista' : 'Ver pista'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${hintOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 text-sm text-muted-foreground rounded-lg border border-border bg-muted/30 p-4">
                    {question.hint}
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
              {question.imageUrl ? (
                <img
                  src={getUploadUrl(question.imageUrl)}
                  alt=""
                  className="mb-4 rounded-lg max-w-full max-h-64 border object-contain"
                />
              ) : null}
              <div className="space-y-3">
                {question.options.map((opt) => {
                  const selected = answers[question.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => selectAnswer(opt.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                        selected ? 'border-primary bg-accent shadow-sm' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          selected ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <span className="text-foreground pt-1">{opt.text}</span>
                        {opt.imageUrl ? (
                          <img
                            src={getUploadUrl(opt.imageUrl)}
                            alt=""
                            className="rounded-lg max-w-full max-h-48 border object-contain"
                          />
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button
              onClick={() =>
                currentIndex === total - 1 ? void finish() : setCurrentIndex((i) => i + 1)
              }
              className={currentIndex === total - 1 ? 'gradient-primary border-0' : ''}
            >
              {currentIndex === total - 1 ? 'Finalizar' : 'Siguiente'} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSimulation;
