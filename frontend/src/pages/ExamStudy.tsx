import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { RichOrPlainBlock } from '@/components/RichOrPlainBlock';
import { hintVisible } from '@/lib/richText';
import type { Exam, ExamFlatQuestion } from '@/types';
import { apiJson } from '@/lib/api';
import { getUploadUrl } from '@/lib/api';
import { toast } from 'sonner';
import { ImpersonationBanner } from '@/components/ImpersonationBanner';

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
  const [searchParams] = useSearchParams();
  const focusQuestionId = searchParams.get('questionId') ?? undefined;
  const [exam, setExam] = useState<Exam | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, LocalAnswer>>({});
  const [hintOpen, setHintOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const selectedOptionButtonRef = useRef<HTMLButtonElement | null>(null);

  const reload = useCallback(async (options?: { preservePosition?: boolean }) => {
    if (!examId) return;
    const preservePosition = options?.preservePosition ?? false;
    try {
      const json = await apiJson<{ data: Exam }>(`/api/exams/${examId}`);
      setExam(json.data);
      if (!preservePosition) {
        const flatLen = json.data.flatQuestions?.length ?? 0;
        const enriched = enrichFlat(json.data.flatQuestions ?? []);
        let idx = Math.min(json.data.currentQuestionIndex, Math.max(0, flatLen - 1));
        if (focusQuestionId) {
          const i = enriched.findIndex((x) => x.id === focusQuestionId);
          if (i >= 0) idx = i;
        }
        setCurrentIndex(idx);
      }
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
  }, [examId, focusQuestionId]);

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

  /** Tras revelar feedback, el contenido crece (más opciones, resumen a la izquierda) y la opción elegida puede quedar fuera de vista; la centramos en el viewport. */
  useEffect(() => {
    if (!revealed || !selectedAnswer || !question) return;
    const t = window.setTimeout(() => {
      selectedOptionButtonRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [revealed, selectedAnswer, question?.id]);

  const questionImageDisplayUrl = question
    ? revealed
      ? (question.feedbackImageUrl ?? question.imageUrl)
      : question.imageUrl
    : undefined;

  const caseFmt = question?.caseTextFormat ?? 'plain';

  const readOnly = exam?.status === 'completed';

  const handleSelect = async (optionId: string) => {
    if (readOnly || !examId || !question || revealed) return;
    try {
      const json = await apiJson<{
        data: { saved: boolean; isCorrect?: boolean; explanation?: string; feedbackImageUrl?: string };
      }>(`/api/exams/${examId}/answer`, {
        method: 'PUT',
        body: JSON.stringify({ questionId: question.id, selectedOptionId: optionId }),
      });
      setAnsweredQuestions((prev) => ({
        ...prev,
        [question.id]: { selectedAnswer: optionId, revealed: true },
      }));
      void json;
      await reload({ preservePosition: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al guardar');
    }
  };

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const nextQuestion = async () => {
    if (currentIndex === total - 1) {
      if (!examId || finishing) return;
      if (exam.status === 'completed') {
        navigate(`/results/${examId}`);
        return;
      }
      setFinishing(true);
      try {
        await apiJson(`/api/exams/${examId}/complete`, {
          method: 'PUT',
          body: JSON.stringify({}),
        });
        navigate(`/results/${examId}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Error al finalizar');
        setFinishing(false);
      }
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

  const reviewBadgeLabel =
    exam.status === 'completed'
      ? exam.config.mode === 'simulation'
        ? 'Revisión del simulacro'
        : 'Revisión del examen'
      : 'Modo Estudio';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ImpersonationBanner />
      <div className="border-b border-border bg-card px-3 sm:px-6 py-3 sticky top-0 z-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4 min-w-0 flex-1">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
              <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full shrink-0">
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Badge className="gradient-primary text-primary-foreground border-0 gap-1 max-w-[min(100%,10rem)] sm:max-w-none truncate text-xs sm:text-sm">
                <BookOpen className="w-3 h-3 shrink-0" /> {reviewBadgeLabel}
              </Badge>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Pregunta <strong className="text-foreground">{currentIndex + 1}</strong> de{' '}
                <strong className="text-foreground">{total}</strong>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs max-w-full">
                <span className="hidden sm:inline">Caso: pregunta </span>
                <span className="sm:hidden">Caso </span>
                {(question.caseQuestionIndex ?? 0) + 1} de {question.caseQuestionTotal ?? 1}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2 w-full md:w-32 shrink-0" />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full min-w-0">
        <div className="space-y-4">
          <Card className="border-0 shadow-md h-fit">
            <CardContent className="p-6">
              <CaseClinicalMetadata
                specialty={question.specialty}
                area={question.area}
                topic={question.topic}
              />
              <RichOrPlainBlock format={caseFmt} text={question.caseText} />
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
                  <RichOrPlainBlock
                    format={caseFmt}
                    text={question.summary}
                    className="text-sm text-muted-foreground leading-relaxed"
                  />
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md border-l-4 border-l-secondary">
                <CardContent className="p-5">
                  <h3 className="font-bold text-foreground flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-secondary" /> Bibliografía
                  </h3>
                  <RichOrPlainBlock
                    format={caseFmt}
                    text={question.bibliography}
                    className="text-sm text-muted-foreground"
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="mb-4">
                {question.leadIn ? (
                  <p className="mb-4 text-sm text-muted-foreground rounded-lg border border-border bg-muted/20 p-4 leading-relaxed">
                    {question.leadIn}
                  </p>
                ) : null}
                <RichOrPlainBlock
                  format={caseFmt}
                  text={question.text}
                  className="text-lg font-semibold text-foreground [&_p]:text-lg [&_p]:font-semibold"
                />
              </div>
              {hintVisible(question.hint, caseFmt) ? (
                <Collapsible open={hintOpen} onOpenChange={setHintOpen} className="mb-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" size="sm" type="button" className="gap-2 w-full sm:w-auto">
                      <Lightbulb className="w-4 h-4" />
                      {hintOpen ? 'Ocultar pista' : 'Ver pista'}
                      <ChevronDown className={`w-4 h-4 transition-transform ${hintOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 text-sm text-muted-foreground rounded-lg border border-border bg-muted/30 p-4">
                    <RichOrPlainBlock format={caseFmt} text={question.hint ?? ''} />
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
              {questionImageDisplayUrl ? (
                <img
                  src={getUploadUrl(questionImageDisplayUrl)}
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
                      // Incorrecta no elegida: visible y claramente descartada
                      borderClass = 'border-muted-foreground/35';
                      bgClass = 'bg-muted/30';
                    }
                  } else if (isSelected) {
                    borderClass = 'border-primary bg-accent';
                  }

                  return (
                    <button
                      key={opt.id}
                      ref={opt.id === selectedAnswer ? selectedOptionButtonRef : undefined}
                      type="button"
                      onClick={() => handleSelect(opt.id)}
                      disabled={revealed || readOnly}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 scroll-mt-24 ${borderClass} ${bgClass}`}
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
                        ) : revealed && !isCorrect ? (
                          <XCircle className="w-4 h-4 opacity-60" aria-hidden />
                        ) : (
                          opt.label
                        )}
                      </span>
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <RichOrPlainBlock format={caseFmt} text={opt.text} className="text-foreground" />
                        {opt.imageUrl ? (
                          <img
                            src={getUploadUrl(opt.imageUrl)}
                            alt=""
                            className="rounded-lg max-w-full max-h-48 border object-contain"
                          />
                        ) : null}
                        {revealed && (opt.explanation || opt.feedbackImageUrl) ? (
                          <>
                            {opt.explanation ? (
                              <RichOrPlainBlock
                                format={caseFmt}
                                text={opt.explanation}
                                className="text-sm text-muted-foreground mt-2 italic"
                              />
                            ) : null}
                            {opt.feedbackImageUrl ? (
                              <img
                                src={getUploadUrl(opt.feedbackImageUrl)}
                                alt=""
                                className="rounded-lg max-w-full max-h-48 border object-contain mt-2"
                              />
                            ) : null}
                          </>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {(revealed || readOnly) && (
            <div className="flex gap-3 animate-fade-in">
              <Button variant="outline" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)} className="flex-1 h-12 gap-2">
                <ChevronLeft className="w-4 h-4" /> Anterior
              </Button>
              <Button
                onClick={() => void nextQuestion()}
                disabled={finishing}
                className="flex-1 gradient-primary border-0 font-semibold h-12 gap-2"
              >
                {finishing
                  ? 'Guardando…'
                  : currentIndex === total - 1
                    ? exam.status === 'completed'
                      ? 'Volver a resultados'
                      : 'Ver resultados'
                    : 'Siguiente pregunta'}
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
