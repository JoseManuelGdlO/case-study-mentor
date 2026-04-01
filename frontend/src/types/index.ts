export type ExamMode = 'simulation' | 'study';
export type ExamLanguage = 'es' | 'en';
export type ExamStatus = 'in_progress' | 'completed' | 'not_started';
/** 1 = Baja, 2 = Media, 3 = Alta */
export type DifficultyLevel = 1 | 2 | 3;
export type CaseStatus = 'draft' | 'published' | 'archived';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  meta?: PaginationMeta;
}

export interface Category {
  id: string;
  name: string;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface AnswerOption {
  id: string;
  label: string; // A, B, C, D
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
  explanation?: string;
}

export interface Question {
  id: string;
  text: string;
  imageUrl?: string;
  options: AnswerOption[];
  summary: string;
  bibliography: string;
  difficultyLevel: DifficultyLevel;
  cognitiveCompetence: boolean;
  previousEnarmPresence: boolean;
  hint: string;
}

export interface LabResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  normalRange: string;
}

export interface ClinicalCase {
  id: string;
  /** Present when loaded from API (editor) */
  specialtyId?: string;
  areaId?: string;
  specialty: string;
  area: string;
  topic: string;
  language: ExamLanguage;
  text: string;
  imageUrl?: string;
  labResults?: LabResult[];
  questions: Question[];
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ExamConfig {
  language: ExamLanguage;
  mode: ExamMode;
  adaptiveMode?: boolean;
  categories: string[];
  subcategories: string[];
  questionCount: number;
  questionFilter?: 'all' | 'unanswered' | 'answered';
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
}

/** Pregunta en orden plano del examen (desde API) */
export interface ExamFlatQuestion extends Question {
  caseText: string;
  caseImageUrl?: string | null;
  /** Especialidad del caso */
  specialty: string;
  /** Subespecialidad / área */
  area: string;
  /** Tema del caso clínico */
  topic: string;
  caseId: string;
  caseQuestionIndex?: number;
  caseQuestionTotal?: number;
  labResults: LabResult[];
  globalOrder?: number;
}

export interface Exam {
  id: string;
  config: ExamConfig;
  cases: ClinicalCase[];
  answers: UserAnswer[];
  currentQuestionIndex: number;
  status: ExamStatus;
  score: number | null;
  prediction?: {
    specialty: string;
    estimatedPercentile: number;
    placementProbability: number;
    version: string;
  } | null;
  startedAt: string;
  completedAt: string | null;
  timeSpentSeconds: number;
  flatQuestions?: ExamFlatQuestion[];
}

export interface UserStats {
  totalExams: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracyPercent: number;
  studyStreak: number;
  byCategory: { category: string; total: number; correct: number; percent: number }[];
  weeklyProgress: { week: string; score: number }[];
  prediction?: {
    examId: string;
    completedAt: string | null;
    specialty: string;
    estimatedPercentile: number;
    placementProbability: number;
    version: string;
  } | null;
}

export interface StudyPlanTask {
  id: string;
  type: 'question_set' | 'flashcard_set' | 'mini_case';
  title: string;
  description?: string | null;
  targetCount: number;
  completedCount: number;
  completed: boolean;
  payload?: {
    flashcards?: { id: string; question: string; answer: string; hint?: string | null }[];
    cases?: {
      id: string;
      topic: string;
      specialty: string;
      area: string;
      text: string;
      question: {
        id: string;
        text: string;
        options: { id: string; label: string; text: string; isCorrect: boolean; explanation: string }[];
      } | null;
    }[];
    questions?: { id: string; text: string; hint: string; topic: string; specialty: string; area: string }[];
  };
}

export interface StudyPlan {
  id: string;
  date: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  isFreeLimited: boolean;
  premium: boolean;
  targetMinutes: number;
  completionPercent: number;
  estimatedImpact14Days: {
    scoreDelta: number;
    percentileDelta: number;
  };
  tasks: StudyPlanTask[];
}

export interface StudyPlanImpact {
  last14Days: {
    totalPlans: number;
    completedPlans: number;
    completionRate: number;
    scoreDelta: number;
    percentileDelta: number;
  };
  estimate: {
    scoreDelta: number;
    percentileDelta: number;
  };
}

/** Frases motivacionales activas (API `/api/content/banner`). */
export interface MotivationalPhrase {
  id: string;
  text: string;
  author: string;
  isActive: boolean;
  createdAt: string;
}

/** Fecha de examen ENARM u otra (countdown del dashboard). */
export interface DashboardExamDate {
  id: string;
  name: string;
  date: string;
  isActive: boolean;
}
