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
  isCorrect: boolean;
  explanation: string;
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

export interface ClinicalCase {
  id: string;
  specialty: string;
  area: string;
  topic: string;
  language: ExamLanguage;
  text: string;
  imageUrl?: string;
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
}

export interface UserAnswer {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
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
