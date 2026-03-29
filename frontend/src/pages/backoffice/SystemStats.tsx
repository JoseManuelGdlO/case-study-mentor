import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingDown, Activity } from 'lucide-react';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';

type BackofficeStats = {
  totalUsers: number;
  totalExams: number;
  totalCases: number;
  totalQuestions: number;
  activeUsers: number;
  freeUsers: number;
  monthlySubscribers: number;
  semesterSubscribers: number;
  annualSubscribers: number;
  estimatedRevenue: number;
  avgAccuracy: number;
  abandonRate: number;
};

const SystemStats = () => {
  const [stats, setStats] = useState<BackofficeStats | null>(null);

  useEffect(() => {
    let c = false;
    apiJson<{ data: BackofficeStats }>('/api/backoffice/stats')
      .then((r) => {
        if (!c) setStats(r.data);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Error al cargar estadísticas'));
    return () => {
      c = true;
    };
  }, []);

  const statCards = stats
    ? [
        { label: 'Precisión Promedio', value: `${stats.avgAccuracy}%`, icon: Target, color: 'text-primary' },
        { label: 'Tasa de Abandono', value: `${stats.abandonRate}%`, icon: TrendingDown, color: 'text-destructive' },
        { label: 'Total Exámenes', value: stats.totalExams.toLocaleString(), icon: Activity, color: 'text-secondary' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estadísticas del Sistema</h1>
        <p className="text-muted-foreground">Métricas agregadas disponibles en la API</p>
      </div>

      {!stats ? (
        <p className="text-muted-foreground">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {statCards.map((s) => (
              <Card key={s.label}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                    <s.icon className={`w-6 h-6 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Usuarios:</span> {stats.totalUsers.toLocaleString()} (activos según
                API: {stats.activeUsers.toLocaleString()})
              </p>
              <p>
                <span className="font-medium text-foreground">Casos clínicos:</span> {stats.totalCases.toLocaleString()}
              </p>
              <p>
                <span className="font-medium text-foreground">Preguntas:</span> {stats.totalQuestions.toLocaleString()}
              </p>
              <p>
                <span className="font-medium text-foreground">Planes de pago (usuarios):</span> mensual{' '}
                {stats.monthlySubscribers}, semestral {stats.semesterSubscribers}, anual {stats.annualSubscribers}
              </p>
              <p className="pt-2">
                Gráficos de rendimiento por especialidad, distribución de planes y preguntas más falladas no están expuestos por el
                backend; cuando existan endpoints, se pueden enlazar aquí.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SystemStats;
