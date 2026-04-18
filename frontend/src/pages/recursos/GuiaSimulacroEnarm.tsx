import { RecursosGuideLayout } from '@/components/RecursosGuideLayout';

export default function GuiaSimulacroEnarm() {
  return (
    <RecursosGuideLayout
      title="Simulacro ENARM: ritmo, estrategia y práctica"
      description="Cómo sacar provecho a un simulacro ENARM: tiempo por bloque, control de ansiedad y revisión después del intento. Guía práctica para médicos en formación en México."
      path="/recursos/simulacro-enarm"
      socialTitle="Simulacro ENARM — guía ENARMX"
      heading="Cómo usar un simulacro ENARM con sentido"
    >
      <p>
        Buscar “simulacro ENARM” suele mezclar dos cosas: copiar el formato del examen y entrenar la toma de decisiones
        bajo presión. El segundo es el que más te acerca al día real: el ENARM no premia solo saber conceptos sueltos,
        sino aplicarlos con tiempo limitado y sin perder el hilo clínico.
      </p>
      <h2 className="text-xl font-semibold pt-2">Ritmo y bloques</h2>
      <p>
        Practica con el mismo tipo de límite temporal que usarás en salón (o en la modalidad que aplique tu convocatoria).
        Si te quedas atascado en un reactivo, marca y sigue: el simulacro sirve para detectar en qué tipo de preguntas
        pierdes minutos — no para demostrarte que “sabes todo” en una sola pasada.
      </p>
      <h2 className="text-xl font-semibold pt-2">Después del intento</h2>
      <p>
        Dedica tiempo a revisar equivocaciones y aciertos “a suerte”. Agrupa errores por tema (p. ej. farmacología,
        imagenología, pediatría) para ver patrones. En ENARMX puedes complementar con estadísticas y sesiones de estudio;
        la idea es cerrar brechas con datos, no solo con horas frente al libro.
      </p>
      <h2 className="text-xl font-semibold pt-2">Expectativas realistas</h2>
      <p>
        Un simulacro es medición, no veredicto. Úsalo para ajustar tu plan semanal: más casos en tus áreas débiles,
        menos repetición pasiva en las que ya eres consistente. Así el término “simulacro ENARM” deja de ser ansiedad y
        se vuelve herramienta.
      </p>
    </RecursosGuideLayout>
  );
}
