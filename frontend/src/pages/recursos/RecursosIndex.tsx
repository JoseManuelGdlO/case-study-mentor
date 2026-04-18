import { Link } from 'react-router-dom';
import { BookOpen, BarChart3, FileText, LineChart } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Seo } from '@/components/Seo';

const guides = [
  {
    to: '/recursos/simulacro-enarm',
    title: 'Cómo usar un simulacro ENARM',
    description: 'Ritmo, enfoque y qué buscar al practicar con tiempo limitado.',
    icon: BookOpen,
  },
  {
    to: '/recursos/casos-clinicos-enarm',
    title: 'Casos clínicos y el ENARM',
    description: 'Por qué el razonamiento clínico importa más que memorizar listas sueltas.',
    icon: FileText,
  },
  {
    to: '/recursos/preparacion-enarm-mexico',
    title: 'Preparación ENARM en México',
    description: 'Organiza tu estudio alrededor del examen real y tus metas de residencia.',
    icon: LineChart,
  },
  {
    to: '/recursos/estadisticas-y-metricas',
    title: 'Estadísticas y métricas de estudio',
    description: 'Usa datos de desempeño para priorizar temas y recuperar tiempo en el examen.',
    icon: BarChart3,
  },
];

export default function RecursosIndex() {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <Seo
        title="Guías y recursos para preparar el ENARM"
        description="Artículos prácticos sobre simulacros, casos clínicos, preparación en México y uso de estadísticas para el Examen Nacional de Residencias Médicas."
        path="/recursos"
        socialTitle="Recursos ENARM — ENARMX"
      />
      <div className="container max-w-4xl">
        <h1 className="text-3xl font-bold text-foreground mb-2">Guías y recursos ENARM</h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">
          Contenido orientado a búsquedas reales: simulacro ENARM, casos clínicos, preparación en México y cómo aprovechar
          métricas de estudio. Sin reemplazar el consejo de tu escuela o asesor — es material general para organizarte
          mejor.
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {guides.map(({ to, title, description, icon: Icon }) => (
            <li key={to}>
              <Link to={to} className="block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="h-full transition-shadow hover:shadow-md border-border">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <Icon className="h-8 w-8 text-primary shrink-0 mt-0.5" aria-hidden />
                      <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription className="mt-1.5">{description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-muted-foreground">
          <Link to="/" className="text-primary font-medium hover:underline underline-offset-2">
            Volver al inicio
          </Link>
          {' · '}
          <Link to="/precios" className="text-primary font-medium hover:underline underline-offset-2">
            Planes y precios
          </Link>
        </p>
      </div>
    </div>
  );
}
