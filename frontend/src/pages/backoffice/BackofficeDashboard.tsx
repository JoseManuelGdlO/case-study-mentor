import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, FileText, HelpCircle, DollarSign, TrendingUp } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema ENARM Prep</p>
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
