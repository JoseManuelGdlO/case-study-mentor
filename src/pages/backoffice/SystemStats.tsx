import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Target, TrendingDown, Activity } from 'lucide-react';
import {
  mockSystemMetrics,
  mockPerformanceBySpecialty,
  mockPlanDistribution,
  mockWeeklyNewUsers,
  mockMostFailedQuestions,
} from '@/data/backofficeData';

const COLORS = ['hsl(var(--muted-foreground))', 'hsl(var(--secondary))', 'hsl(var(--primary))', 'hsl(var(--success))'];

const statCards = [
  { label: 'Precisión Promedio', value: `${mockSystemMetrics.avgAccuracy}%`, icon: Target, color: 'text-primary' },
  { label: 'Tasa de Abandono', value: `${mockSystemMetrics.abandonRate}%`, icon: TrendingDown, color: 'text-destructive' },
  { label: 'Exámenes Activos', value: '342', icon: Activity, color: 'text-secondary' },
];

const SystemStats = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estadísticas del Sistema</h1>
        <p className="text-muted-foreground">Métricas detalladas de rendimiento y uso</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rendimiento por especialidad</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ accuracy: { label: 'Precisión %', color: 'hsl(var(--primary))' } }} className="h-[280px]">
              <BarChart data={mockPerformanceBySpecialty} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" />
                <YAxis dataKey="specialty" type="category" width={100} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="accuracy" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución de planes</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={{ value: { label: 'Usuarios' } }} className="h-[280px] w-full">
              <PieChart>
                <Pie data={mockPlanDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {mockPlanDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tendencia de registros semanales</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ users: { label: 'Nuevos usuarios', color: 'hsl(var(--secondary))' } }} className="h-[220px]">
            <BarChart data={mockWeeklyNewUsers}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="week" className="text-xs" />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="users" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preguntas más falladas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Pregunta</TableHead>
                <TableHead>Especialidad</TableHead>
                <TableHead>Tasa de error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMostFailedQuestions.map((q, i) => (
                <TableRow key={q.id}>
                  <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{q.text}</TableCell>
                  <TableCell><Badge variant="secondary">{q.specialty}</Badge></TableCell>
                  <TableCell>
                    <span className="font-bold text-destructive">{q.failRate}%</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStats;
