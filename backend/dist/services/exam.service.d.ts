import type { z } from 'zod';
import type { generateExamSchema } from '../schemas/exam.schema.js';
type GenerateInput = z.infer<typeof generateExamSchema>;
export declare function generateExam(userId: string, input: GenerateInput): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en";
            mode: "simulation" | "study";
            categories: string[];
            subcategories: string[];
            questionCount: number;
            questionFilter: string;
        };
        cases: ({
            id: string;
            specialty: string;
            area: string;
            topic: string;
            language: string;
            text: string;
            imageUrl?: string | null;
            labResults: unknown[];
            questions: unknown[];
            status: string;
            createdAt: string;
            updatedAt: string;
        } | undefined)[];
        answers: {
            questionId: string;
            selectedOptionId: string | null;
            isCorrect: boolean | null;
        }[];
        currentQuestionIndex: number;
        status: "not_started" | "in_progress" | "completed";
        score: number | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "explanation">[];
            summary: string;
            bibliography: string;
            difficulty: string;
            caseText: string;
            caseImageUrl: string | null;
            specialty: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
    };
}>;
export declare function listExams(userId: string, page: number, limit: number): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en";
            mode: "simulation" | "study";
            categories: string[];
            subcategories: string[];
            questionCount: number;
            questionFilter: string;
        };
        status: "not_started" | "in_progress" | "completed";
        score: number | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        currentQuestionIndex: number;
        createdAt: string;
    }[];
    total: number;
    page: number;
    totalPages: number;
}>;
export declare function getExamById(userId: string, examId: string): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en";
            mode: "simulation" | "study";
            categories: string[];
            subcategories: string[];
            questionCount: number;
            questionFilter: string;
        };
        cases: ({
            id: string;
            specialty: string;
            area: string;
            topic: string;
            language: string;
            text: string;
            imageUrl?: string | null;
            labResults: unknown[];
            questions: unknown[];
            status: string;
            createdAt: string;
            updatedAt: string;
        } | undefined)[];
        answers: {
            questionId: string;
            selectedOptionId: string | null;
            isCorrect: boolean | null;
        }[];
        currentQuestionIndex: number;
        status: "not_started" | "in_progress" | "completed";
        score: number | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "explanation">[];
            summary: string;
            bibliography: string;
            difficulty: string;
            caseText: string;
            caseImageUrl: string | null;
            specialty: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
    };
}>;
export declare function submitAnswer(userId: string, examId: string, body: {
    questionId: string;
    selectedOptionId: string | null;
}): Promise<{
    data: {
        saved: boolean;
        isCorrect: boolean;
        explanation: string;
    };
} | {
    data: {
        saved: boolean;
        isCorrect?: undefined;
        explanation?: undefined;
    };
}>;
export declare function completeExam(userId: string, examId: string, timeSpentSeconds?: number): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en";
            mode: "simulation" | "study";
            categories: string[];
            subcategories: string[];
            questionCount: number;
            questionFilter: string;
        };
        cases: ({
            id: string;
            specialty: string;
            area: string;
            topic: string;
            language: string;
            text: string;
            imageUrl?: string | null;
            labResults: unknown[];
            questions: unknown[];
            status: string;
            createdAt: string;
            updatedAt: string;
        } | undefined)[];
        answers: {
            questionId: string;
            selectedOptionId: string | null;
            isCorrect: boolean | null;
        }[];
        currentQuestionIndex: number;
        status: "not_started" | "in_progress" | "completed";
        score: number | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "explanation">[];
            summary: string;
            bibliography: string;
            difficulty: string;
            caseText: string;
            caseImageUrl: string | null;
            specialty: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
    };
}>;
export declare function getExamResults(userId: string, examId: string): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en";
            mode: "simulation" | "study";
            categories: string[];
            subcategories: string[];
            questionCount: number;
            questionFilter: string;
        };
        cases: ({
            id: string;
            specialty: string;
            area: string;
            topic: string;
            language: string;
            text: string;
            imageUrl?: string | null;
            labResults: unknown[];
            questions: unknown[];
            status: string;
            createdAt: string;
            updatedAt: string;
        } | undefined)[];
        answers: {
            questionId: string;
            selectedOptionId: string | null;
            isCorrect: boolean | null;
        }[];
        currentQuestionIndex: number;
        status: "not_started" | "in_progress" | "completed";
        score: number | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "explanation">[];
            summary: string;
            bibliography: string;
            difficulty: string;
            caseText: string;
            caseImageUrl: string | null;
            specialty: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
    };
}>;
export {};
//# sourceMappingURL=exam.service.d.ts.map