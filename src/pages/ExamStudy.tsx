import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockCases } from '@/data/mockData';
import { ChevronRight, ChevronLeft, CheckCircle2, XCircle, BookOpen, FileText, ArrowLeft } from 'lucide-react';

const allQuestions = mockCases.flatMap((c) =>
  c.questions.map((q, qIdx) => ({ ...q, caseText: c.text, caseImageUrl: c.imageUrl, specialty: c.specialty, caseId: c.id, caseQuestionIndex: qIdx, caseQuestionTotal: c.questions.length }))
);

const ExamStudy = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Record<string, { selectedAnswer: string; revealed: boolean }>>({});

  const question = allQuestions[currentIndex];
  const total = allQuestions.length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);

  const currentState = answeredQuestions[question.id];
  const selectedAnswer = currentState?.selectedAnswer ?? null;
  const revealed = currentState?.revealed ?? false;

  const handleSelect = (optionId: string) => {
    if (revealed) return;
    setAnsweredQuestions((prev) => ({
      ...prev,
      [question.id]: { selectedAnswer: optionId, revealed: true },
    }));
  };

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const nextQuestion = () => {
    if (currentIndex === total - 1) {
      navigate('/results/exam-1');
      return;
    }
    setCurrentIndex((i) => i + 1);
  };

  const correctOption = question.options.find((o) => o.isCorrect);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Badge className="gradient-primary text-primary-foreground border-0 gap-1">
            <BookOpen className="w-3 h-3" /> Modo Estudio
          </Badge>
          <span className="text-sm text-muted-foreground">
            Pregunta <strong className="text-foreground">{currentIndex + 1}</strong> de <strong className="text-foreground">{total}</strong>
          </span>
          <Badge variant="secondary" className="text-xs">
            Caso: pregunta {question.caseQuestionIndex + 1} de {question.caseQuestionTotal}
          </Badge>
        </div>
        <Progress value={progress} className="w-32 h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Case */}
        <Card className="border-0 shadow-md h-fit">
          <CardContent className="p-6">
            <Badge variant="outline" className="mb-3">{question.specialty}</Badge>
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="leading-relaxed">{question.caseText}</p>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">{question.text}</h2>
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
                      onClick={() => handleSelect(opt.id)}
                      disabled={revealed}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${borderClass} ${bgClass}`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        revealed && isCorrect ? 'bg-success text-success-foreground' :
                        revealed && isSelected && !isCorrect ? 'bg-destructive text-destructive-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {revealed && isCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                         revealed && isSelected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                         opt.label}
                      </span>
                      <div className="flex-1">
                        <span className="text-foreground">{opt.text}</span>
                        {revealed && (isSelected || isCorrect) && (
                          <p className="text-sm text-muted-foreground mt-2 italic">{opt.explanation}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
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
              <div className="flex gap-3">
                <Button variant="outline" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)} className="flex-1 h-12 gap-2">
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </Button>
                <Button onClick={nextQuestion} className="flex-1 gradient-primary border-0 font-semibold h-12 gap-2">
                  {currentIndex === total - 1 ? 'Finalizar examen' : 'Siguiente pregunta'}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamStudy;
