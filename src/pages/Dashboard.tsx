import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockExams, mockStats } from '@/data/mockData';
import { BookOpen, Target, Flame, TrendingUp, Plus, Clock, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const inProgress = mockExams.filter(e => e.status === 'in_progress');
  const completed = mockExams.filter(e => e.status === 'completed');

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">¡Hola, Dr. Juan! 👋</h1>
          <p className="text-muted-foreground mt-1">Continúa tu preparación para el ENARM</p>
        </div>
        <Button className="gradient-primary border-0 font-semibold gap-2 h-12 px-6" onClick={() => navigate('/dashboard/new-exam')}>
          <Plus className="w-5 h-5" /> Nuevo Examen
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Preguntas', value: mockStats.totalQuestions.toLocaleString(), icon: BookOpen, color: 'text-primary' },
          { label: 'Aciertos', value: `${mockStats.accuracyPercent}%`, icon: Target, color: 'text-success' },
          { label: 'Racha', value: `${mockStats.studyStreak} días`, icon: Flame, color: 'text-warning' },
          { label: 'Exámenes', value: mockStats.totalExams.toString(), icon: TrendingUp, color: 'text-secondary' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* In Progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Exámenes en curso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((exam) => {
              const progress = Math.round((exam.currentQuestionIndex / exam.config.questionCount) * 100);
              return (
                <Card key={exam.id} className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate(`/exam/${exam.id}/${exam.config.mode}`)}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="secondary" className="bg-accent text-accent-foreground">
                        {exam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {Math.round(exam.timeSpentSeconds / 60)} min
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{exam.config.categories.join(', ')}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{exam.config.subcategories.join(', ')}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{exam.currentQuestionIndex}/{exam.config.questionCount} preguntas</span>
                        <span className="font-medium text-primary">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="mt-3 flex items-center text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Continuar <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Historial de exámenes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completed.map((exam) => (
            <Card key={exam.id} className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/results/${exam.id}`)}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">{exam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(exam.startedAt).toLocaleDateString('es-MX')}</span>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{exam.config.categories.join(', ')}</h3>
                <p className="text-sm text-muted-foreground mb-3">{exam.config.questionCount} preguntas</p>
                <div className="flex items-center gap-2">
                  <div className={`text-3xl font-bold ${(exam.score ?? 0) >= 70 ? 'text-success' : 'text-destructive'}`}>
                    {exam.score}%
                  </div>
                  <span className="text-sm text-muted-foreground">calificación</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
