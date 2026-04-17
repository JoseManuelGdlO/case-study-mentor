import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Texto extra (p. ej. versión del modelo) debajo de la lista */
  footer?: ReactNode;
};

/**
 * Explica qué miden la probabilidad de plaza y el percentil respecto a la especialidad de referencia.
 */
export function PredictionMetricsExplainer({ className, footer }: Props) {
  return (
    <Alert className={cn('border-primary/25 bg-muted/35', className)}>
      <Info className="h-4 w-4 text-primary" />
      <AlertTitle className="text-sm text-foreground">¿Qué significan estos valores?</AlertTitle>
      <AlertDescription className="text-muted-foreground mt-2">
        <ul className="list-disc pl-4 space-y-2 text-xs sm:text-sm [&_strong]:text-foreground [&_strong]:font-medium">
          <li>
            <strong>Especialidad que ves arriba</strong> (por ejemplo, cirugía general): es la{' '}
            <strong>especialidad de referencia</strong> que usamos para calibrar la estimación: suele ser la
            primera que elegiste al crear el examen o la indicada para la predicción. Los números hablan de tu
            posición competitiva respecto a una <strong>plaza de residencia en esa área</strong>, no de otra
            especialidad distinta.
          </li>
          <li>
            <strong>Probabilidad de plaza (%):</strong> estimación orientativa de qué tan viable sería obtener
            una <strong>residencia en esa especialidad</strong>, según tu puntaje en el simulador y tablas de
            calibración internas. <strong>No</strong> es un resultado oficial del ENARM ni un dato de las
            autoridades; sirve como guía de estudio.
          </li>
          <li>
            <strong>Percentil estimado (P…):</strong> posición relativa aproximada en una escala tipo 1–99
            (un valor más alto suele indicar mejor desempeño relativo en el marco del modelo). Complementa la
            probabilidad para ver si vas más “arriba” o “abajo” frente a ese referente, no es tu percentil
            real del examen oficial.
          </li>
        </ul>
        {footer ? <div className="mt-3 pt-2 border-t border-border/60 text-xs text-muted-foreground">{footer}</div> : null}
      </AlertDescription>
    </Alert>
  );
}
