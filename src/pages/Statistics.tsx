import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mockStats } from '@/data/mockData';
import { BarChart3, Target, TrendingUp, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const Statistics = () => {
  const strong = [...mockStats.byCategory].sort((a, b) => b.percent - a.percent).slice(0, 2);
  const weak = [...mockStats.byCategory].sort((a, b) => a.percent - b.percent).slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Estadísticas</h1>
        <p className="text-muted-foreground">Tu rendimiento general en la plataforma</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Exámenes totales', value: mockStats.totalExams, icon: BookOpen, color: 'text-primary' },
          { label: 'Preguntas contestadas', value: mockStats.totalQuestions, icon: BarChart3, color: 'text-secondary' },
          { label: 'Respuestas correctas', value: mockStats.correctAnswers, icon: Target, color: 'text-success' },
          { label: '% de aciertos', value: `${mockStats.accuracyPercent}%`, icon: TrendingUp, color: 'text-warning' },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-md">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Progreso semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={mockStats.weeklyProgress}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Rendimiento por especialidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mockStats.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="percent" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md border-l-4 border-l-success">
          <CardHeader><CardTitle className="text-success">💪 Áreas fuertes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {strong.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{c.category}</span>
                  <span className="font-bold text-success">{c.percent}%</span>
                </div>
                <Progress value={c.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md border-l-4 border-l-destructive">
          <CardHeader><CardTitle className="text-destructive">📌 Áreas a mejorar</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {weak.map((c) => (
              <div key={c.category}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-foreground">{c.category}</span>
                  <span className="font-bold text-destructive">{c.percent}%</span>
                </div>
                <Progress value={c.percent} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
