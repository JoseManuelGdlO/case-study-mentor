export type ExamMode = 'simulation' | 'study';
export type ExamLanguage = 'es' | 'en';
export type ExamStatus = 'in_progress' | 'completed' | 'not_started';
export type Difficulty = 'low' | 'medium' | 'high';
export type CaseStatus = 'draft' | 'published' | 'archived';

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
  difficulty: Difficulty;
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
}

export interface ExamConfig {
  language: ExamLanguage;
  mode: ExamMode;
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
  specialty: string;
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
