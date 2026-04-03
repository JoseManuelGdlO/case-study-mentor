export declare function listPendingMentorReviews(pageInput?: number, limitInput?: number): Promise<{
    data: {
        id: string;
        mode: string;
        score: number | null;
        questionCount: number;
        completedAt: string | null;
        user: {
            email: string;
            firstName: string;
            lastName: string;
        };
    }[];
    total: number;
    page: number;
    totalPages: number;
}>;
export declare function getMentorReviewExamDetail(examId: string): Promise<{
    data: {
        exam: {
            id: string;
            config: {
                language: "es" | "en";
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
        };
        student: {
            email: string;
            firstName: string;
            lastName: string;
        };
    };
}>;
export declare function submitMentorReview(examId: string, reviewerId: string, body: {
    rating: number;
    comment?: string;
}): Promise<{
    data: {
        exam: {
            id: string;
            config: {
                language: "es" | "en";
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
        };
        student: {
            email: string;
            firstName: string;
            lastName: string;
        };
    };
}>;
//# sourceMappingURL=exam-review.service.d.ts.map