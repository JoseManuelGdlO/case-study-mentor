import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Target, TrendingDown, Activity } from 'lucide-react';
import { apiJson } from '@/lib/api';
import { toast } from 'sonner';
import type { BackofficeStats } from '@/types/backoffice';

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

  const distribution = stats?.caseDistribution ?? [];

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
                <span className="font-medium text-foreground">Casos clínicos:</span>{' '}
                {stats.totalCases.toLocaleString()} en total,{' '}
                <span className="font-medium text-foreground">{stats.totalPublishedCases.toLocaleString()}</span> publicados
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Casos por especialidad y subespecialidad</CardTitle>
              <p className="text-sm text-muted-foreground font-normal">
                Totales incluyen todos los estados; la columna «Publicados» solo cuenta casos con estado publicado. Útil para
                priorizar nuevos casos donde hay menos contenido.
              </p>
            </CardHeader>
            <CardContent>
              {distribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay especialidades registradas.</p>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {distribution.map((row) => (
                    <AccordionItem key={row.specialtyId} value={row.specialtyId}>
                      <AccordionTrigger className="hover:no-underline">
                        <span className="flex flex-1 flex-wrap items-center justify-between gap-2 pr-2 text-left">
                          <span className="font-medium text-foreground">{row.specialtyName}</span>
                          <span className="text-sm font-normal text-muted-foreground tabular-nums">
                            {row.totalCases.toLocaleString()} total · {row.publishedCases.toLocaleString()} publicados
                          </span>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto pb-2">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="border-b text-left text-muted-foreground">
                                <th className="py-2 pr-4 font-medium">Subespecialidad (área)</th>
                                <th className="py-2 pr-4 font-medium text-right tabular-nums">Total</th>
                                <th className="py-2 font-medium text-right tabular-nums">Publicados</th>
                              </tr>
                            </thead>
                            <tbody>
                              {row.areas.map((a) => (
                                <tr key={a.areaId} className="border-b border-border/60 last:border-0">
                                  <td className="py-2 pr-4 text-foreground">{a.areaName}</td>
                                  <td className="py-2 pr-4 text-right tabular-nums text-muted-foreground">
                                    {a.totalCases.toLocaleString()}
                                  </td>
                                  <td className="py-2 text-right tabular-nums text-muted-foreground">
                                    {a.publishedCases.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default SystemStats;
