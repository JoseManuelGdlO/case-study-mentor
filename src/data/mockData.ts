import { Category, ClinicalCase, Exam, UserStats } from '@/types';

export const categories: Category[] = [
  {
    id: 'med-interna', name: 'Medicina Interna',
    subcategories: [
      { id: 'cardio', name: 'Cardiología', categoryId: 'med-interna' },
      { id: 'neuro', name: 'Neurología', categoryId: 'med-interna' },
      { id: 'neumol', name: 'Neumología', categoryId: 'med-interna' },
      { id: 'gastro', name: 'Gastroenterología', categoryId: 'med-interna' },
      { id: 'nefro', name: 'Nefrología', categoryId: 'med-interna' },
      { id: 'endocrino', name: 'Endocrinología', categoryId: 'med-interna' },
    ],
  },
  {
    id: 'cirugia', name: 'Cirugía',
    subcategories: [
      { id: 'cir-general', name: 'Cirugía General', categoryId: 'cirugia' },
      { id: 'trauma', name: 'Traumatología', categoryId: 'cirugia' },
      { id: 'neuro-cir', name: 'Neurocirugía', categoryId: 'cirugia' },
    ],
  },
  {
    id: 'pediatria', name: 'Pediatría',
    subcategories: [
      { id: 'neo', name: 'Neonatología', categoryId: 'pediatria' },
      { id: 'ped-general', name: 'Pediatría General', categoryId: 'pediatria' },
      { id: 'ped-infecto', name: 'Infectología Pediátrica', categoryId: 'pediatria' },
    ],
  },
  {
    id: 'gineco', name: 'Ginecología y Obstetricia',
    subcategories: [
      { id: 'obste', name: 'Obstetricia', categoryId: 'gineco' },
      { id: 'gineco-gen', name: 'Ginecología General', categoryId: 'gineco' },
    ],
  },
];

export const mockCases: ClinicalCase[] = [
  {
    id: 'case-1',
    specialty: 'Medicina Interna',
    area: 'Cardiología',
    topic: 'Infarto Agudo al Miocardio',
    language: 'es',
    text: 'Paciente masculino de 58 años que acude al servicio de urgencias por dolor torácico opresivo de 2 horas de evolución, irradiado a brazo izquierdo y mandíbula. Antecedentes: hipertensión arterial sistémica de 10 años de evolución, diabetes mellitus tipo 2, tabaquismo activo (20 cigarrillos/día por 30 años). A la exploración: diaforético, PA 90/60 mmHg, FC 110 lpm, FR 24 rpm. EKG muestra elevación del segmento ST en derivaciones V1-V4.',
    imageUrl: undefined,
    questions: [
      {
        id: 'q-1',
        text: '¿Cuál es el diagnóstico más probable?',
        options: [
          { id: 'q1-a', label: 'A', text: 'Angina estable', isCorrect: false, explanation: 'La angina estable se presenta con dolor torácico predecible con el esfuerzo y cede con reposo o nitroglicerina.' },
          { id: 'q1-b', label: 'B', text: 'Infarto agudo al miocardio con elevación del ST (IAMCEST)', isCorrect: true, explanation: 'El cuadro clínico con dolor torácico típico, factores de riesgo cardiovascular y elevación del ST en V1-V4 es compatible con IAMCEST anterior.' },
          { id: 'q1-c', label: 'C', text: 'Tromboembolia pulmonar', isCorrect: false, explanation: 'La TEP suele presentarse con disnea súbita, dolor pleurítico y el EKG típicamente muestra patrón S1Q3T3.' },
          { id: 'q1-d', label: 'D', text: 'Disección aórtica', isCorrect: false, explanation: 'La disección aórtica se presenta con dolor torácico desgarrante de inicio súbito, generalmente irradiado a espalda.' },
        ],
        summary: 'El IAMCEST se diagnostica con dolor torácico isquémico >20 minutos + elevación del segmento ST ≥1mm en 2 derivaciones contiguas o nuevo bloqueo de rama izquierda.',
        bibliography: 'Braunwald\'s Heart Disease, 12th Edition. Cap. 38: ST-Elevation Myocardial Infarction.',
        difficulty: 'medium',
      },
      {
        id: 'q-2',
        text: '¿Cuál es el tratamiento inicial más adecuado para este paciente?',
        options: [
          { id: 'q2-a', label: 'A', text: 'Aspirina + Clopidogrel + Heparina + Intervención coronaria percutánea primaria', isCorrect: true, explanation: 'El tratamiento de elección para IAMCEST es la ICP primaria dentro de los primeros 90-120 minutos junto con doble antiagregación y anticoagulación.' },
          { id: 'q2-b', label: 'B', text: 'Solo observación y reposo', isCorrect: false, explanation: 'El IAMCEST es una emergencia cardiovascular que requiere tratamiento inmediato.' },
          { id: 'q2-c', label: 'C', text: 'Antibióticos intravenosos', isCorrect: false, explanation: 'Los antibióticos no tienen indicación en el infarto agudo al miocardio.' },
          { id: 'q2-d', label: 'D', text: 'Cirugía de revascularización coronaria urgente', isCorrect: false, explanation: 'La cirugía de bypass se reserva para casos con anatomía coronaria no favorable para ICP o complicaciones mecánicas.' },
        ],
        summary: 'El manejo del IAMCEST incluye: MONA (Morfina, Oxígeno, Nitroglicerina, Aspirina) + doble antiagregación + anticoagulación + reperfusión (ICP primaria preferida sobre fibrinólisis si está disponible en <120 min).',
        bibliography: 'Guía ESC 2023: Manejo del IAMCEST. European Heart Journal.',
        difficulty: 'medium',
      },
    ],
    status: 'published',
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: 'case-2',
    specialty: 'Pediatría',
    area: 'Neonatología',
    topic: 'Síndrome de Dificultad Respiratoria',
    language: 'es',
    text: 'Recién nacido prematuro de 32 semanas de gestación, producto de cesárea por preeclampsia severa. A los 30 minutos de vida presenta taquipnea (FR 72 rpm), aleteo nasal, tiraje intercostal y quejido espiratorio. La radiografía de tórax muestra patrón reticulogranular difuso bilateral con broncograma aéreo.',
    imageUrl: undefined,
    questions: [
      {
        id: 'q-3',
        text: '¿Cuál es el diagnóstico más probable?',
        options: [
          { id: 'q3-a', label: 'A', text: 'Neumonía neonatal', isCorrect: false, explanation: 'La neumonía neonatal puede presentar infiltrados pero generalmente son focales y hay antecedentes de riesgo infeccioso.' },
          { id: 'q3-b', label: 'B', text: 'Síndrome de dificultad respiratoria (Enfermedad de membrana hialina)', isCorrect: true, explanation: 'Prematuro <34 SDG con dificultad respiratoria progresiva y Rx con patrón reticulogranular + broncograma aéreo es el cuadro clásico de SDR por déficit de surfactante.' },
          { id: 'q3-c', label: 'C', text: 'Taquipnea transitoria del recién nacido', isCorrect: false, explanation: 'La TTRN suele ser benigna, más frecuente en nacidos por cesárea a término, con Rx que muestra líquido en cisuras.' },
          { id: 'q3-d', label: 'D', text: 'Hernia diafragmática congénita', isCorrect: false, explanation: 'La hernia diafragmática se presenta con abdomen escafoide y asas intestinales en tórax en la Rx.' },
        ],
        summary: 'El SDR o enfermedad de membrana hialina es la causa más frecuente de dificultad respiratoria en prematuros, causada por déficit de surfactante pulmonar.',
        bibliography: 'Nelson Textbook of Pediatrics, 21st Ed. Cap. 122.',
        difficulty: 'low',
      },
    ],
    status: 'published',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-05',
  },
  {
    id: 'case-3',
    specialty: 'Ginecología y Obstetricia',
    area: 'Obstetricia',
    topic: 'Preeclampsia',
    language: 'es',
    text: 'Paciente femenina de 28 años, primigesta de 34 semanas de gestación, acude a control prenatal. Se detecta presión arterial de 160/110 mmHg en dos tomas separadas por 4 horas. Refiere cefalea intensa, fosfenos y acúfenos. Laboratorios: proteinuria 3+, plaquetas 95,000/mm³, TGO 180 U/L, TGP 200 U/L, DHL 650 U/L, creatinina 1.3 mg/dL.',
    imageUrl: undefined,
    questions: [
      {
        id: 'q-4',
        text: '¿Cuál es el diagnóstico?',
        options: [
          { id: 'q4-a', label: 'A', text: 'Hipertensión gestacional', isCorrect: false, explanation: 'La hipertensión gestacional no presenta proteinuria ni datos de severidad.' },
          { id: 'q4-b', label: 'B', text: 'Preeclampsia con criterios de severidad', isCorrect: true, explanation: 'PA ≥160/110, síntomas cerebrales (cefalea, fosfenos), trombocitopenia <100,000, elevación de transaminasas >2x su valor normal, cumplen criterios de preeclampsia con datos de severidad.' },
          { id: 'q4-c', label: 'C', text: 'Síndrome HELLP', isCorrect: false, explanation: 'Aunque hay componentes del HELLP (hemólisis, enzimas hepáticas elevadas, plaquetopenia), el diagnóstico principal es preeclampsia severa con datos de HELLP.' },
          { id: 'q4-d', label: 'D', text: 'Eclampsia', isCorrect: false, explanation: 'La eclampsia requiere la presencia de convulsiones, que no se mencionan en este caso.' },
        ],
        summary: 'La preeclampsia con criterios de severidad se define por PA ≥160/110, cefalea/fosfenos, plaquetas <100,000, alteración hepática, insuficiencia renal o edema pulmonar.',
        bibliography: 'Williams Obstetrics, 26th Ed. Cap. 40: Hypertensive Disorders.',
        difficulty: 'high',
      },
    ],
    status: 'published',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-05',
  },
];

const allQuestions = mockCases.flatMap(c => c.questions);

export const mockExams: Exam[] = [
  {
    id: 'exam-1',
    config: { language: 'es', mode: 'study', categories: ['Medicina Interna'], subcategories: ['Cardiología'], questionCount: 20 },
    cases: [mockCases[0]],
    answers: [
      { questionId: 'q-1', selectedOptionId: 'q1-b', isCorrect: true },
      { questionId: 'q-2', selectedOptionId: 'q2-a', isCorrect: true },
    ],
    currentQuestionIndex: 2,
    status: 'in_progress',
    score: null,
    startedAt: '2024-03-25T10:00:00',
    completedAt: null,
    timeSpentSeconds: 1800,
  },
  {
    id: 'exam-2',
    config: { language: 'es', mode: 'simulation', categories: ['Pediatría'], subcategories: ['Neonatología'], questionCount: 50 },
    cases: [mockCases[1]],
    answers: allQuestions.slice(0, 1).map(q => ({ questionId: q.id, selectedOptionId: q.options[1].id, isCorrect: q.options[1].isCorrect })),
    currentQuestionIndex: 50,
    status: 'completed',
    score: 78,
    startedAt: '2024-03-20T08:00:00',
    completedAt: '2024-03-20T10:30:00',
    timeSpentSeconds: 9000,
  },
  {
    id: 'exam-3',
    config: { language: 'es', mode: 'simulation', categories: ['Ginecología y Obstetricia'], subcategories: ['Obstetricia'], questionCount: 30 },
    cases: [mockCases[2]],
    answers: [],
    currentQuestionIndex: 30,
    status: 'completed',
    score: 85,
    startedAt: '2024-03-18T14:00:00',
    completedAt: '2024-03-18T15:45:00',
    timeSpentSeconds: 6300,
  },
];

export const mockStats: UserStats = {
  totalExams: 12,
  totalQuestions: 480,
  correctAnswers: 350,
  accuracyPercent: 73,
  studyStreak: 7,
  byCategory: [
    { category: 'Medicina Interna', total: 180, correct: 140, percent: 78 },
    { category: 'Cirugía', total: 100, correct: 68, percent: 68 },
    { category: 'Pediatría', total: 120, correct: 90, percent: 75 },
    { category: 'Ginecología y Obstetricia', total: 80, correct: 52, percent: 65 },
  ],
  weeklyProgress: [
    { week: 'Sem 1', score: 60 },
    { week: 'Sem 2', score: 65 },
    { week: 'Sem 3', score: 68 },
    { week: 'Sem 4', score: 72 },
    { week: 'Sem 5', score: 70 },
    { week: 'Sem 6', score: 75 },
    { week: 'Sem 7', score: 73 },
    { week: 'Sem 8', score: 78 },
  ],
};
