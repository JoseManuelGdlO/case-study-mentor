import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, FileText, HelpCircle, DollarSign, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { mockSystemMetrics, mockWeeklyNewUsers, mockWeeklyExams, mockTopSpecialties } from '@/data/backofficeData';

const metrics = [
  { label: 'Total Usuarios', value: mockSystemMetrics.totalUsers.toLocaleString(), icon: Users, color: 'text-primary' },
  { label: 'Usuarios Activos', value: mockSystemMetrics.activeUsers.toLocaleString(), icon: UserCheck, color: 'text-secondary' },
  { label: 'Suscripciones Activas', value: (mockSystemMetrics.monthlySubscribers + mockSystemMetrics.semesterSubscribers + mockSystemMetrics.annualSubscribers).toLocaleString(), icon: TrendingUp, color: 'text-success' },
  { label: 'Casos Publicados', value: mockSystemMetrics.totalCases.toLocaleString(), icon: FileText, color: 'text-primary' },
  { label: 'Total Preguntas', value: mockSystemMetrics.totalQuestions.toLocaleString(), icon: HelpCircle, color: 'text-secondary' },
  { label: 'Ingresos Estimados', value: `$${mockSystemMetrics.estimatedRevenue.toLocaleString()} MXN`, icon: DollarSign, color: 'text-success' },
];

const BackofficeDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Vista general del sistema ENARM Prep</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nuevos usuarios por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ users: { label: 'Usuarios', color: 'hsl(var(--primary))' } }} className="h-[250px]">
              <BarChart data={mockWeeklyNewUsers}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Exámenes realizados por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{ exams: { label: 'Exámenes', color: 'hsl(var(--secondary))' } }} className="h-[250px]">
              <BarChart data={mockWeeklyExams}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="week" className="text-xs" />
                <YAxis className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="exams" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 5 especialidades más estudiadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockTopSpecialties.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    <span className="text-sm text-muted-foreground">{s.exams} exámenes</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-primary"
                      style={{ width: `${(s.exams / mockTopSpecialties[0].exams) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackofficeDashboard;
