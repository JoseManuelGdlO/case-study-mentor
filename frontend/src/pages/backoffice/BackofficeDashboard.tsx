import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, FileText, HelpCircle, DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';
import type { BackofficeStats } from '@/types/backoffice';

const BackofficeDashboard = () => {
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

  const subscriptions =
    stats != null
      ? stats.monthlySubscribers + stats.semesterSubscribers + stats.annualSubscribers
      : 0;

  const metrics = stats
    ? [
        { label: 'Total Usuarios', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-primary' },
        { label: 'Usuarios Activos', value: stats.activeUsers.toLocaleString(), icon: UserCheck, color: 'text-secondary' },
        { label: 'Suscripciones (registradas)', value: subscriptions.toLocaleString(), icon: TrendingUp, color: 'text-success' },
        { label: 'Casos', value: stats.totalCases.toLocaleString(), icon: FileText, color: 'text-primary' },
        { label: 'Total Preguntas', value: stats.totalQuestions.toLocaleString(), icon: HelpCircle, color: 'text-secondary' },
        { label: 'Ingresos Estimados', value: `$${stats.estimatedRevenue.toLocaleString()} MXN`, icon: DollarSign, color: 'text-success' },
      ]
    : [];

  const topSpecialtiesByCases = useMemo(() => {
    if (!stats?.caseDistribution?.length) return [];
    return [...stats.caseDistribution]
      .sort((a, b) => b.totalCases - a.totalCases)
      .slice(0, 3);
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema ENARMX</p>
      </div>

      {!stats ? (
        <p className="text-muted-foreground">Cargando métricas…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((m) => (
            <Card key={m.label}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <m.icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-xl font-bold text-foreground">{m.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="text-lg">Casos por especialidad</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              {stats != null ? (
                <>
                  {stats.totalCases.toLocaleString()} casos en total,{' '}
                  {stats.totalPublishedCases.toLocaleString()} publicados. Desglose completo por subespecialidad en Estadísticas.
                </>
              ) : (
                '—'
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
            <Link to="/backoffice/stats">
              <BarChart3 className="h-4 w-4" />
              Ver estadísticas
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {stats != null && topSpecialtiesByCases.length > 0 ? (
            <ul className="text-sm text-muted-foreground space-y-2">
              {topSpecialtiesByCases.map((s, i) => (
                <li key={s.specialtyId}>
                  <span className="font-medium text-foreground">{i + 1}. {s.specialtyName}</span>
                  <span className="tabular-nums">
                    {' '}
                    — {s.totalCases.toLocaleString()} total, {s.publishedCases.toLocaleString()} publicados
                  </span>
                </li>
              ))}
            </ul>
          ) : stats != null ? (
            <p className="text-sm text-muted-foreground">No hay datos de especialidades todavía.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exámenes en el sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {stats != null ? (
              <>
                Total de exámenes generados:{' '}
                <span className="font-semibold text-foreground">{stats.totalExams.toLocaleString()}</span>
              </>
            ) : (
              '—'
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Los gráficos por semana y el ranking de especialidades requieren endpoints adicionales; por ahora solo se muestran los
            totales desde la API.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackofficeDashboard;
