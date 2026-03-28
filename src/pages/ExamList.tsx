import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockExams } from '@/data/mockData';
import { Plus, Clock, ArrowRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExamList = () => {
  const navigate = useNavigate();
  const inProgress = mockExams.filter((e) => e.status === 'in_progress');
  const completed = mockExams.filter((e) => e.status === 'completed');

  const renderExamCard = (exam: typeof mockExams[0]) => {
    const progress = Math.round((exam.currentQuestionIndex / exam.config.questionCount) * 100);
    const isCompleted = exam.status === 'completed';
    return (
      <Card key={exam.id} className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => isCompleted ? navigate(`/results/${exam.id}`) : navigate(`/exam/${exam.id}/${exam.config.mode}`)}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <Badge variant={isCompleted ? 'outline' : 'secondary'} className={!isCompleted ? 'bg-accent text-accent-foreground' : ''}>
              {exam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(exam.startedAt).toLocaleDateString('es-MX')}
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-1">{exam.config.categories.join(', ')}</h3>
          <p className="text-sm text-muted-foreground mb-3">{exam.config.questionCount} preguntas · {exam.config.language === 'es' ? 'Español' : 'English'}</p>
          {isCompleted ? (
            <div className={`text-3xl font-bold ${(exam.score ?? 0) >= 70 ? 'text-success' : 'text-destructive'}`}>{exam.score}%</div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{exam.currentQuestionIndex}/{exam.config.questionCount}</span>
                <span className="font-medium text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Exámenes</h1>
          <p className="text-muted-foreground">Todos tus exámenes en un solo lugar</p>
        </div>
        <Button className="gradient-primary border-0 font-semibold gap-2" onClick={() => navigate('/dashboard/new-exam')}>
          <Plus className="w-4 h-4" /> Nuevo Examen
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({mockExams.length})</TabsTrigger>
          <TabsTrigger value="progress">En curso ({inProgress.length})</TabsTrigger>
          <TabsTrigger value="completed">Terminados ({completed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{mockExams.map(renderExamCard)}</div>
        </TabsContent>
        <TabsContent value="progress" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{inProgress.map(renderExamCard)}</div>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{completed.map(renderExamCard)}</div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExamList;
