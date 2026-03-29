export interface MotivationalPhrase {
  id: string;
  text: string;
  author?: string;
  isActive: boolean;
  createdAt: string;
}

export const mockPhrases: MotivationalPhrase[] = [
  { id: 'p1', text: 'El éxito en medicina no es cuestión de suerte, es cuestión de preparación.', author: 'ENARMX', isActive: true, createdAt: '2024-01-10' },
  { id: 'p2', text: 'Cada pregunta que respondes hoy te acerca un paso más a tu especialidad soñada.', isActive: true, createdAt: '2024-01-15' },
  { id: 'p3', text: 'La disciplina es el puente entre tus metas y tus logros.', author: 'Jim Rohn', isActive: true, createdAt: '2024-02-01' },
  { id: 'p4', text: 'No estudias para pasar un examen, estudias para salvar vidas.', isActive: true, createdAt: '2024-02-10' },
  { id: 'p5', text: 'El mejor doctor no es el que más sabe, sino el que nunca deja de aprender.', isActive: true, createdAt: '2024-02-20' },
  { id: 'p6', text: 'Tu futuro paciente te necesita preparado. Sigue adelante.', author: 'ENARMX', isActive: true, createdAt: '2024-03-01' },
  { id: 'p7', text: 'La medicina es una carrera de resistencia, no de velocidad.', isActive: false, createdAt: '2024-03-05' },
  { id: 'p8', text: 'Hoy es un gran día para aprender algo nuevo.', isActive: true, createdAt: '2024-03-10' },
];
