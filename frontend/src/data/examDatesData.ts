export interface ExamDate {
  id: string;
  name: string;
  date: string; // ISO date string
  description: string;
  isActive: boolean;
}

export const mockExamDates: ExamDate[] = [
  { id: 'ed1', name: 'ENARM 2026', date: '2026-11-15T08:00:00', description: 'Examen Nacional de Residencias Médicas 2026', isActive: true },
  { id: 'ed2', name: 'ENARM 2027', date: '2027-11-20T08:00:00', description: 'Examen Nacional de Residencias Médicas 2027', isActive: false },
];
