import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  BookOpen,
  FileText,
  ArrowLeft,
  Lightbulb,
  ChevronDown,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import LabResultsAccordion from '@/components/LabResultsAccordion';
import { CaseClinicalMetadata } from '@/components/CaseClinicalMetadata';
import type { Exam, ExamFlatQuestion } from '@/types';
import { apiJson } from '@/lib/api';
import { getUploadUrl } from '@/lib/api';
import { toast } from 'sonner';

type LocalAnswer = { selectedAnswer: string; revealed: boolean };

function enrichFlat(flat: ExamFlatQuestion[]): ExamFlatQuestion[] {
  const counts = new Map<string, number>();
  return flat.map((q) => {
    const n = counts.get(q.caseId) ?? 0;
    counts.set(q.caseId, n + 1);
    const total = flat.filter((f) => f.caseId === q.caseId).length;
    return { ...q, caseQuestionIndex: n, caseQuestionTotal: total };
  });
}

const ExamStudy = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, LocalAnswer>>({});
  const [hintOpen, setHintOpen] = useState(false);

  const reload = useCallback(async () => {
    if (!examId) return;
    try {
      const json = await apiJson<{ data: Exam }>(`/api/exams/${examId}`);
      setExam(json.data);
      const next: Record<string, LocalAnswer> = {};
      for (const a of json.data.answers) {
        if (a.selectedOptionId) {
          next[a.questionId] = { selectedAnswer: a.selectedOptionId, revealed: true };
        }
      }
      setAnsweredQuestions((prev) => ({ ...next, ...prev }));
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Error');
    }
  }, [examId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const flat = useMemo(() => enrichFlat(exam?.flatQuestions ?? []), [exam]);
  const question = flat[currentIndex];
  const total = flat.length;

  useEffect(() => {
    setHintOpen(false);
  }, [question?.id]);
  const progress = total ? Math.round(((currentIndex + 1) / total) * 100) : 0;

  const currentState = question ? answeredQuestions[question.id] : undefined;
  const selectedAnswer = currentState?.selectedAnswer ?? null;
  const revealed = currentState?.revealed ?? false;

  const handleSelect = async (optionId: string) => {
    if (!examId || !question || revealed) return;
    try {
      const json = await apiJson<{
        data: { saved: boolean; isCorrect?: boolean; explanation?: string };
      }>(`/api/exams/${examId}/answer`, {
        method: 'PUT',
        body: JSON.stringify({ questionId: question.id, selectedOptionId: optionId }),
      });
      setAnsweredQuestions((prev) => ({
        ...prev,
        [question.id]: { selectedAnswer: optionId, revealed: true },
      }));
      void json;
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const nextQuestion = () => {
    if (currentIndex === total - 1) {
      navigate(`/results/${examId}`);
      return;
    }
    setCurrentIndex((i) => i + 1);
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
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Badge className="gradient-primary text-primary-foreground border-0 gap-1">
            <BookOpen className="w-3 h-3" /> Modo Estudio
          </Badge>
          <span className="text-sm text-muted-foreground">
            Pregunta <strong className="text-foreground">{currentIndex + 1}</strong> de{' '}
            <strong className="text-foreground">{total}</strong>
          </span>
          <Badge variant="secondary" className="text-xs">
            Caso: pregunta {(question.caseQuestionIndex ?? 0) + 1} de {question.caseQuestionTotal ?? 1}
          </Badge>
        </div>
        <Progress value={progress} className="w-32 h-2" />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 p-6 max-w-7xl mx-auto w-full">
        <div className="space-y-4">
          <Card className="border-0 shadow-md h-fit">
            <CardContent className="p-6">
              <CaseClinicalMetadata
                specialty={question.specialty}
                area={question.area}
                topic={question.topic}
              />
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="leading-relaxed">{question.caseText}</p>
              </div>
              {question.caseImageUrl && (
                <img
                  src={getUploadUrl(question.caseImageUrl)}
                  alt="Caso"
                  className="mt-4 rounded-lg max-w-full"
                />
              )}
            </CardContent>
          </Card>
          <LabResultsAccordion labs={question.labResults} />

          {revealed && (
            <div className="space-y-3 animate-fade-in">
              <Card className="border-0 shadow-md border-l-4 border-l-primary">
                <CardContent className="p-5">
                  <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-primary" /> En Resumen
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{question.summary}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md border-l-4 border-l-secondary">
                <CardContent className="p-5">
                  <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-secondary" /> Bibliografía
                  </h3>
                  <p className="text-sm text-muted-foreground">{question.bibliography}</p>
                </CardContent>
              </Card>
            </div>
          )}
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
                  const isSelected = selectedAnswer === opt.id;
                  const isCorrect = opt.isCorrect;
                  let borderClass = 'border-border hover:border-primary/50';
                  let bgClass = '';

                  if (revealed) {
                    if (isCorrect) {
                      borderClass = 'border-success';
                      bgClass = 'bg-success/10';
                    } else if (isSelected && !isCorrect) {
                      borderClass = 'border-destructive';
                      bgClass = 'bg-destructive/10';
                    } else {
                      borderClass = 'border-border opacity-50';
                    }
                  } else if (isSelected) {
                    borderClass = 'border-primary bg-accent';
                  }

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelect(opt.id)}
                      disabled={revealed}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${borderClass} ${bgClass}`}
                    >
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          revealed && isCorrect
                            ? 'bg-success text-success-foreground'
                            : revealed && isSelected && !isCorrect
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {revealed && isCorrect ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : revealed && isSelected && !isCorrect ? (
                          <XCircle className="w-4 h-4" />
                        ) : (
                          opt.label
                        )}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <span className="text-foreground">{opt.text}</span>
                        {opt.imageUrl ? (
                          <img
                            src={getUploadUrl(opt.imageUrl)}
                            alt=""
                            className="rounded-lg max-w-full max-h-48 border object-contain"
                          />
                        ) : null}
                        {revealed && (isSelected || isCorrect) && opt.explanation && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{opt.explanation}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {revealed && (
            <div className="flex gap-3 animate-fade-in">
              <Button variant="outline" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)} className="flex-1 h-12 gap-2">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button onClick={nextQuestion} className="flex-1 gradient-primary border-0 font-semibold h-12 gap-2">
                {currentIndex === total - 1 ? 'Ver resultados' : 'Siguiente pregunta'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamStudy;
