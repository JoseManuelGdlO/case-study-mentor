import type { z } from 'zod';
import type { generateExamSchema, submitExamFeedbackSchema } from '../schemas/exam.schema.js';
type GenerateInput = z.infer<typeof generateExamSchema>;
type SubmitExamFeedbackInput = z.infer<typeof submitExamFeedbackSchema>;
export declare function generateExam(userId: string, input: GenerateInput): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en" | "both";
            mode: "simulation" | "study";
            adaptiveMode: boolean;
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
            textFormat: "plain" | "html";
            imageUrl?: string | null;
            generatedByIa: boolean;
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
        prediction: {
            specialty: string;
            estimatedPercentile: number;
            placementProbability: number;
            version: string;
        } | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "feedbackImageUrl" | "explanation">[];
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            caseText: string;
            caseTextFormat: import("@prisma/client").$Enums.CaseTextFormat;
            caseImageUrl: string | null;
            specialty: string;
            area: string;
            topic: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
        mentorReview: {
            rating: number;
            comment: string;
            reviewedAt: string;
        } | null;
        studentFeedbackEligible: boolean;
        studentFeedbackSubmitted: boolean;
    };
} | {
    meta: {
        requestedQuestionCount: number;
        actualQuestionCount: number;
    };
    data: {
        id: string;
        config: {
            language: "es" | "en" | "both";
            mode: "simulation" | "study";
            adaptiveMode: boolean;
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
            textFormat: "plain" | "html";
            imageUrl?: string | null;
            generatedByIa: boolean;
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
        prediction: {
            specialty: string;
            estimatedPercentile: number;
            placementProbability: number;
            version: string;
        } | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "feedbackImageUrl" | "explanation">[];
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            caseText: string;
            caseTextFormat: import("@prisma/client").$Enums.CaseTextFormat;
            caseImageUrl: string | null;
            specialty: string;
            area: string;
            topic: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
        mentorReview: {
            rating: number;
            comment: string;
            reviewedAt: string;
        } | null;
        studentFeedbackEligible: boolean;
        studentFeedbackSubmitted: boolean;
    };
}>;
export declare function listExams(userId: string, page: number, limit: number): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en" | "both";
            mode: "simulation" | "study";
            adaptiveMode: boolean;
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
            language: "es" | "en" | "both";
            mode: "simulation" | "study";
            adaptiveMode: boolean;
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
            textFormat: "plain" | "html";
            imageUrl?: string | null;
            generatedByIa: boolean;
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
        prediction: {
            specialty: string;
            estimatedPercentile: number;
            placementProbability: number;
            version: string;
        } | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "feedbackImageUrl" | "explanation">[];
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            caseText: string;
            caseTextFormat: import("@prisma/client").$Enums.CaseTextFormat;
            caseImageUrl: string | null;
            specialty: string;
            area: string;
            topic: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
        mentorReview: {
            rating: number;
            comment: string;
            reviewedAt: string;
        } | null;
        studentFeedbackEligible: boolean;
        studentFeedbackSubmitted: boolean;
    };
}>;
export declare function submitAnswer(userId: string, examId: string, body: {
    questionId: string;
    selectedOptionId: string | null;
    responseTimeSeconds?: number;
}): Promise<{
    data: {
        saved: boolean;
        isCorrect: boolean;
        explanation: string;
        feedbackImageUrl: string | undefined;
    };
} | {
    data: {
        saved: boolean;
        isCorrect?: undefined;
        explanation?: undefined;
        feedbackImageUrl?: undefined;
    };
}>;
export declare function completeExam(userId: string, examId: string, timeSpentSeconds?: number): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en" | "both";
            mode: "simulation" | "study";
            adaptiveMode: boolean;
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
            textFormat: "plain" | "html";
            imageUrl?: string | null;
            generatedByIa: boolean;
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
        prediction: {
            specialty: string;
            estimatedPercentile: number;
            placementProbability: number;
            version: string;
        } | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "feedbackImageUrl" | "explanation">[];
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            caseText: string;
            caseTextFormat: import("@prisma/client").$Enums.CaseTextFormat;
            caseImageUrl: string | null;
            specialty: string;
            area: string;
            topic: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
        mentorReview: {
            rating: number;
            comment: string;
            reviewedAt: string;
        } | null;
        studentFeedbackEligible: boolean;
        studentFeedbackSubmitted: boolean;
    };
}>;
export declare function getExamResults(userId: string, examId: string): Promise<{
    data: {
        id: string;
        config: {
            language: "es" | "en" | "both";
            mode: "simulation" | "study";
            adaptiveMode: boolean;
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
            textFormat: "plain" | "html";
            imageUrl?: string | null;
            generatedByIa: boolean;
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
        prediction: {
            specialty: string;
            estimatedPercentile: number;
            placementProbability: number;
            version: string;
        } | null;
        startedAt: string;
        completedAt: string | null;
        timeSpentSeconds: number;
        flatQuestions: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "feedbackImageUrl" | "explanation">[];
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            caseText: string;
            caseTextFormat: import("@prisma/client").$Enums.CaseTextFormat;
            caseImageUrl: string | null;
            specialty: string;
            area: string;
            topic: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        }[];
        mentorReview: {
            rating: number;
            comment: string;
            reviewedAt: string;
        } | null;
        studentFeedbackEligible: boolean;
        studentFeedbackSubmitted: boolean;
    };
}>;
export declare function submitExamFeedback(userId: string, examId: string, body: SubmitExamFeedbackInput): Promise<{
    data: {
        saved: boolean;
    };
}>;
export declare function getNextQuestion(userId: string, examId: string): Promise<{
    data: {
        examId: string;
        currentQuestionIndex: number;
        question: {
            id: string;
            globalOrder: number;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            options: Omit<{
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }, "isCorrect" | "feedbackImageUrl" | "explanation">[];
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            caseText: string;
            caseTextFormat: import("@prisma/client").$Enums.CaseTextFormat;
            caseImageUrl: string | null;
            specialty: string;
            area: string;
            topic: string;
            caseId: string;
            labResults: {
                id: string;
                name: string;
                value: string;
                unit: string;
                normalRange: string;
            }[];
        };
        totalQuestions: number;
    };
}>;
export {};
//# sourceMappingURL=exam.service.d.ts.map