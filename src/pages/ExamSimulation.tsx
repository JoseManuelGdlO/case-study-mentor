import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockCases } from '@/data/mockData';
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react';
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

const allQuestions = mockCases.flatMap((c) =>
  c.questions.map((q, qIdx) => ({ ...q, caseText: c.text, caseImageUrl: c.imageUrl, specialty: c.specialty, caseId: c.id, caseQuestionIndex: qIdx, caseQuestionTotal: c.questions.length, labResults: c.labResults || [] }))
);

const ExamSimulation = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const question = allQuestions[currentIndex];
  const total = allQuestions.length;
  const progress = Math.round(((currentIndex + 1) / total) * 100);
  const formatTime = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const selectAnswer = (optionId: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
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
            Caso: pregunta {question.caseQuestionIndex + 1} de {question.caseQuestionTotal}
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
                  Has contestado {Object.keys(answers).length} de {total} preguntas. Las preguntas sin contestar se marcarán como incorrectas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Seguir contestando</AlertDialogCancel>
                <AlertDialogAction onClick={() => navigate('/results/exam-1')}>Terminar y ver resultados</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Case */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md h-fit">
            <CardContent className="p-6">
              <Badge className="gradient-primary text-primary-foreground border-0 mb-3">{question.specialty}</Badge>
              <div className="prose prose-sm max-w-none text-foreground">
                <p className="leading-relaxed">{question.caseText}</p>
              </div>
              {question.caseImageUrl && (
                <img src={question.caseImageUrl} alt="Caso clínico" className="mt-4 rounded-lg max-w-full" />
              )}
            </CardContent>
          </Card>
          <LabResultsAccordion labs={question.labResults} />
        </div>
        </Card>

        {/* Question + Options */}
        <div className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">{question.text}</h2>
              <div className="space-y-3">
                {question.options.map((opt) => {
                  const selected = answers[question.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => selectAnswer(opt.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3 ${
                        selected ? 'border-primary bg-accent shadow-sm' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        selected ? 'gradient-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {opt.label}
                      </span>
                      <span className="text-foreground pt-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </Button>
            <Button
              onClick={() => currentIndex === total - 1 ? navigate('/results/exam-1') : setCurrentIndex((i) => i + 1)}
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
