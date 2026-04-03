import type { z } from 'zod';
import type { createCaseSchema, updateCaseSchema } from '../schemas/case.schema.js';
type CreateCase = z.infer<typeof createCaseSchema>;
type UpdateCase = z.infer<typeof updateCaseSchema>;
export declare function listCases(query: {
    specialty?: string;
    area?: string;
    status?: string;
    page?: string | number;
    limit?: string | number;
}): Promise<{
    data: {
        id: string;
        specialtyId: string;
        areaId: string;
        specialty: string;
        area: string;
        topic: string;
        language: string;
        text: string;
        textFormat: "plain" | "html";
        imageUrl: string | undefined;
        generatedByIa: boolean;
        labResults: {
            id: string;
            name: string;
            value: string;
            unit: string;
            normalRange: string;
        }[];
        questions: {
            id: string;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            orderIndex: number;
            options: {
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
        createdBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
        updatedBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
    }[];
    total: number;
    page: number;
    totalPages: number;
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare function getCaseById(id: string): Promise<{
    data: {
        id: string;
        specialtyId: string;
        areaId: string;
        specialty: string;
        area: string;
        topic: string;
        language: string;
        text: string;
        textFormat: "plain" | "html";
        imageUrl: string | undefined;
        generatedByIa: boolean;
        labResults: {
            id: string;
            name: string;
            value: string;
            unit: string;
            normalRange: string;
        }[];
        questions: {
            id: string;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            orderIndex: number;
            options: {
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
        createdBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
        updatedBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
    };
}>;
export declare function createCase(input: CreateCase, userId: string): Promise<{
    data: {
        id: string;
        specialtyId: string;
        areaId: string;
        specialty: string;
        area: string;
        topic: string;
        language: string;
        text: string;
        textFormat: "plain" | "html";
        imageUrl: string | undefined;
        generatedByIa: boolean;
        labResults: {
            id: string;
            name: string;
            value: string;
            unit: string;
            normalRange: string;
        }[];
        questions: {
            id: string;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            orderIndex: number;
            options: {
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
        createdBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
        updatedBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
    };
}>;
export declare function updateCase(id: string, input: UpdateCase, userId: string): Promise<{
    data: {
        id: string;
        specialtyId: string;
        areaId: string;
        specialty: string;
        area: string;
        topic: string;
        language: string;
        text: string;
        textFormat: "plain" | "html";
        imageUrl: string | undefined;
        generatedByIa: boolean;
        labResults: {
            id: string;
            name: string;
            value: string;
            unit: string;
            normalRange: string;
        }[];
        questions: {
            id: string;
            text: string;
            imageUrl: string | undefined;
            feedbackImageUrl: string | undefined;
            summary: string;
            bibliography: string;
            difficultyLevel: number;
            cognitiveCompetence: boolean;
            previousEnarmPresence: boolean;
            hint: string;
            orderIndex: number;
            options: {
                id: string;
                label: string;
                text: string;
                imageUrl: string | undefined;
                feedbackImageUrl: string | undefined;
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
        createdBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
        updatedBy: {
            id: string;
            name: string;
            email: string;
        } | undefined;
    };
}>;
export declare function deleteCase(id: string): Promise<{
    data: {
        ok: boolean;
    };
}>;
export declare function deleteCasesBulk(ids: string[]): Promise<{
    data: {
        deleted: number;
    };
}>;
export {};
//# sourceMappingURL=case.service.d.ts.map