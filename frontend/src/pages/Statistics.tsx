import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { UserStats } from '@/types';
import { apiJson } from '@/lib/api';
import { BarChart3, Target, TrendingUp, BookOpen, Lock, Crown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useUser } from '@/contexts/UserContext';

const emptyStats: UserStats = {
  totalExams: 0,
  totalQuestions: 0,
  correctAnswers: 0,
  accuracyPercent: 0,
  studyStreak: 0,
  byCategory: [],
  weeklyProgress: [],
};

const Statistics = () => {
  const navigate = useNavigate();
  const { isFreeUser } = useUser();
  const [stats, setStats] = useState<UserStats>(emptyStats);

  useEffect(() => {
    if (isFreeUser) return;
    let c = false;
    apiJson<{ data: UserStats }>('/api/stats')
      .then((r) => {
        if (!c) setStats(r.data);
      })
      .catch(() => {
        if (!c) setStats(emptyStats);
      });
    return () => {
      c = true;
    };
  }, [isFreeUser]);

  const mockStats = stats;
  const strong = [...mockStats.byCategory].sort((a, b) => b.percent - a.percent).slice(0, 2);
  const weak = [...mockStats.byCategory].sort((a, b) => a.percent - b.percent).slice(0, 2);

  if (isFreeUser) {
    return (
      <div className="max-w-7xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Estadísticas</h1>
          <p className="text-muted-foreground">Tu rendimiento general en la plataforma</p>
        </div>
        <div className="relative">
          {/* Blurred preview */}
          <div className="filter blur-md pointer-events-none select-none opacity-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="border-0 shadow-md">
                  <CardContent className="p-5 h-20" />
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md h-72" />
              <Card className="border-0 shadow-md h-72" />
            </div>
          </div>
          {/* Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Estadísticas Premium</h2>
            <p className="text-muted-foreground text-center max-w-sm">
              Suscríbete para ver tus estadísticas completas, progreso semanal y áreas de mejora.
            </p>
            <Button className="gradient-primary border-0 font-semibold gap-2 h-12 px-8" onClick={() => navigate('/dashboard/subscription')}>
              <Crown className="w-5 h-5" /> Suscribirme
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Estadísticas</h1>
        <p className="text-muted-foreground">Tu rendimiento general en la plataforma</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader><CardTitle>Progreso semanal</CardTitle></CardHeader>
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
          <CardHeader><CardTitle>Rendimiento por especialidad</CardTitle></CardHeader>
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
