export type CancelReason =
  | 'too_expensive'
  | 'not_using_enough'
  | 'exam_finished_or_paused'
  | 'found_alternative'
  | 'technical_issues'
  | 'content_not_expected'
  | 'prefer_not_to_say'
  | 'other';

export const CANCEL_REASON_OPTIONS: { value: CancelReason; label: string }[] = [
  { value: 'too_expensive', label: 'Es muy caro / el precio no encaja' },
  { value: 'not_using_enough', label: 'No uso la plataforma lo suficiente' },
  { value: 'exam_finished_or_paused', label: 'Ya terminé o pausé mi preparación al ENARM' },
  { value: 'found_alternative', label: 'Encontré otra alternativa' },
  { value: 'technical_issues', label: 'Problemas técnicos o de experiencia' },
  { value: 'content_not_expected', label: 'El contenido no era lo que esperaba' },
  { value: 'prefer_not_to_say', label: 'Prefiero no decirlo' },
  { value: 'other', label: 'Otro motivo' },
];

export function cancelReasonLabel(reason: string): string {
  return CANCEL_REASON_OPTIONS.find((r) => r.value === reason)?.label ?? reason;
}
