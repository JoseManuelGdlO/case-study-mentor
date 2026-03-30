/** Metadatos del caso clínico (especialidad, subespecialidad, tema) mostrados junto al texto del caso. */
export function CaseClinicalMetadata({
  specialty,
  area,
  topic,
}: {
  specialty: string;
  area: string;
  topic: string;
}) {
  return (
    <div className="space-y-1.5 mb-3 text-sm">
      <p>
        <span className="text-muted-foreground font-medium">Especialidad:</span>{' '}
        <span className="text-foreground">{specialty}</span>
      </p>
      <p>
        <span className="text-muted-foreground font-medium">Subespecialidad:</span>{' '}
        <span className="text-foreground">{area}</span>
      </p>
      <p>
        <span className="text-muted-foreground font-medium">Tema:</span>{' '}
        <span className="text-foreground">{topic}</span>
      </p>
    </div>
  );
}
