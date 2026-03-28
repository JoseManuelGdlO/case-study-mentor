import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockStats, mockCases } from '@/data/mockData';
import { Trophy, BarChart3, Home, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';

const Results = () => {
  const navigate = useNavigate();
  const score = 78;
  const total = 4;
  const correct = 3;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Score Hero */}
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="gradient-hero p-8 text-center text-white">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-5xl font-bold mb-2">{score}%</h1>
            <p className="text-xl text-white/80">Tu calificación</p>
            <div className="flex justify-center gap-8 mt-6 text-sm text-white/70">
              <div><span className="text-2xl font-bold text-white block">{correct}</span>Correctas</div>
              <div><span className="text-2xl font-bold text-white block">{total - correct}</span>Incorrectas</div>
              <div><span className="text-2xl font-bold text-white block">{total}</span>Total</div>
            </div>
          </div>
        </Card>

        {/* Category Breakdown */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Desglose por especialidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockStats.byCategory.map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{cat.category}</span>
                  <span className={`font-bold ${cat.percent >= 70 ? 'text-success' : 'text-destructive'}`}>{cat.percent}%</span>
                </div>
                <Progress value={cat.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Revisión de preguntas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockCases.flatMap(c => c.questions).map((q, i) => {
              const isCorrect = i < correct;
              return (
                <div key={q.id} className={`p-4 rounded-xl border-2 ${isCorrect ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                      {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{q.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Respuesta correcta: <strong className="text-success">{q.options.find(o => o.isCorrect)?.text}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/dashboard')}>
            <Home className="w-4 h-4" /> Ir al Dashboard
          </Button>
          <Button className="gradient-primary border-0 gap-2" onClick={() => navigate('/dashboard/new-exam')}>
            <RotateCcw className="w-4 h-4" /> Nuevo Examen
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
