import { RecursosGuideLayout } from '@/components/RecursosGuideLayout';

export default function GuiaCasosClinicosEnarm() {
  return (
    <RecursosGuideLayout
      title="Casos clínicos ENARM: razonar, no solo memorizar"
      description="Por qué los casos clínicos dominan el ENARM y cómo entrenar lectura rápida, hipótesis y descarte de opciones en México."
      path="/recursos/casos-clinicos-enarm"
      socialTitle="Casos clínicos ENARM — ENARMX"
      heading="Casos clínicos y el Examen Nacional de Residencias Médicas"
    >
      <p>
        Gran parte del ENARM se apoya en vignetas: presentación, antecedentes, exploración y preguntas que obligan a
        integrar conocimiento. Por eso las búsquedas tipo “casos clínicos ENARM” apuntan a un estilo de estudio distinto
        al de repasar listas infinitas.
      </p>
      <h2 className="text-xl font-semibold pt-2">Leer con objetivo</h2>
      <p>
        Antes de mirar las opciones, identifica qué pide el enunciado: diagnóstico, siguiente paso, tratamiento inicial,
        complicación. Eso reduce distracciones y acelera el descarte de respuestas incoherentes con el caso.
      </p>
      <h2 className="text-xl font-semibold pt-2">Integrar guías y contexto mexicano</h2>
      <p>
        Las guías internacionales ayudan, pero el examen suele asumir recursos y prácticas acotadas al sistema de salud y
        a la formación en México. Cuando estudies un caso, pregunta qué harías en tu entorno real: disponibilidad de
        estudios, primeras líneas terapéuticas y seguimiento — sin sustituir el criterio de tu hospital o programa.
      </p>
      <h2 className="text-xl font-semibold pt-2">Práctica deliberada</h2>
      <p>
        Alterna casos largos con sesiones cortas de alta intensidad (varias vignetas seguidas). La repetición mejora el
        patrón de lectura y la velocidad, dos variables que en “casos clínicos ENARM” marcan la diferencia entre
        aprobar y quedarse corto por tiempo.
      </p>
    </RecursosGuideLayout>
  );
}
