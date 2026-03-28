import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockExams, mockStats } from '@/data/mockData';
import { BookOpen, Target, Flame, TrendingUp, Plus, Clock, ArrowRight, Play } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const inProgress = mockExams.filter(e => e.status === 'in_progress');
  const completed = mockExams.filter(e => e.status === 'completed');
  const lastExam = inProgress.length > 0 ? inProgress.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] : null;

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

      {/* Continue Where You Left Off — Hero Card */}
      {lastExam && (() => {
        const progress = Math.round((lastExam.currentQuestionIndex / lastExam.config.questionCount) * 100);
        const timeAgo = getTimeAgo(lastExam.startedAt);
        return (
          <Card
            className="border-0 shadow-xl overflow-hidden cursor-pointer group"
            onClick={() => navigate(`/exam/${lastExam.id}/${lastExam.config.mode}`)}
          >
            <div className="gradient-hero p-6 lg:p-8 relative">
              <div className="absolute inset-0 opacity-10">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white/20" style={{ width: `${60 + i * 30}px`, height: `${60 + i * 30}px`, top: `${10 + i * 10}%`, right: `${-2 + i * 5}%` }} />
                ))}
              </div>
              <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="flex-1">
                  <p className="text-white/70 text-sm font-medium mb-1">Continúa donde te quedaste</p>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">{lastExam.config.categories.join(', ')}</h2>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                      {lastExam.config.mode === 'study' ? '📚 Estudio' : '🎯 Simulación'}
                    </Badge>
                    <span className="text-white/70 text-sm flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {Math.round(lastExam.timeSpentSeconds / 60)} min · {timeAgo}
                    </span>
                  </div>
                  <div className="max-w-md">
                    <div className="flex justify-between text-sm text-white/80 mb-2">
                      <span>{lastExam.currentQuestionIndex} de {lastExam.config.questionCount} preguntas</span>
                      <span className="font-bold text-white">{progress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3">
                      <div className="h-3 rounded-full bg-white transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold gap-2 h-14 px-8 text-base shadow-lg group-hover:scale-105 transition-transform"
                >
                  <Play className="w-5 h-5" /> Continuar examen
                </Button>
              </div>
            </div>
          </Card>
        );
      })()}

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

      {/* Other In-Progress Exams */}
      {inProgress.length > 1 && (
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">Otros exámenes en curso ({inProgress.length - 1})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.filter(e => e.id !== lastExam?.id).map((exam) => {
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

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'hace unos minutos';
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} día${days > 1 ? 's' : ''}`;
}

export default Dashboard;
