import { RecursosGuideLayout } from '@/components/RecursosGuideLayout';

export default function GuiaEstadisticasEnarm() {
  return (
    <RecursosGuideLayout
      title="Estadísticas de estudio para el ENARM"
      description="Para qué sirven las métricas de desempeño al preparar el ENARM: priorizar temas, recuperar tiempo y dejar de repetir lo que ya dominas."
      path="/recursos/estadisticas-y-metricas"
      socialTitle="Estadísticas ENARM — ENARMX"
      heading="Estadísticas y métricas: estudiar con números, no a ciegas"
    >
      <p>
        Las búsquedas sobre estadísticas ENARM suelen buscar dos cosas: cómo se interpreta el resultado del examen y
        cómo usar datos durante la preparación. Aquí nos enfocamos en lo segundo: convertir intentos y errores en
        decisiones de estudio.
      </p>
      <h2 className="text-xl font-semibold pt-2">Qué medir</h2>
      <p>
        Por tema o sistema: porcentaje de aciertos, tiempo medio por pregunta y tendencia en varias semanas. Si un tema
        tiene aciertos altos pero tiempos largos, el riesgo en el examen real es el reloj, no la teoría.
      </p>
      <h2 className="text-xl font-semibold pt-2">Evitar sesgos</h2>
      <p>
        Un mal día no redefine tu nivel; una racha buena tampoco. Mira ventanas de varias sesiones para suavizar el
        ruido. Las estadísticas sirven cuando son estables en el tiempo, no cuando son una sola foto.
      </p>
      <h2 className="text-xl font-semibold pt-2">De la métrica al plan</h2>
      <p>
        Si pediatría sale roja en consistencia y farmacología en tiempo, tu semana debería reflejarlo: más casos
        pediátricos y entrenamiento rápido de dosis e interacciones. Herramientas como ENARMX agrupan parte de esto en el
        producto; fuera de ella puedes replicar la lógica con una hoja simple.
      </p>
    </RecursosGuideLayout>
  );
}
