import type { z } from 'zod';
import type { createCaseSchema, updateCaseSchema } from '../schemas/case.schema.js';
type CreateCase = z.infer<typeof createCaseSchema>;
type UpdateCase = z.infer<typeof updateCaseSchema>;
export declare function listCases(query: {
    specialty?: string;
    area?: string;
    status?: string;
    page?: string;
    limit?: string;
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
        imageUrl: string | undefined;
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
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
    }[];
    total: number;
    page: number;
    totalPages: number;
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
        imageUrl: string | undefined;
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
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
    };
}>;
export declare function createCase(input: CreateCase): Promise<{
    data: {
        id: string;
        specialtyId: string;
        areaId: string;
        specialty: string;
        area: string;
        topic: string;
        language: string;
        text: string;
        imageUrl: string | undefined;
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
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
    };
}>;
export declare function updateCase(id: string, input: UpdateCase): Promise<{
    data: {
        id: string;
        specialtyId: string;
        areaId: string;
        specialty: string;
        area: string;
        topic: string;
        language: string;
        text: string;
        imageUrl: string | undefined;
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
                isCorrect: boolean;
                explanation: string;
            }[];
        }[];
        status: string;
        createdAt: string;
        updatedAt: string;
    };
}>;
export declare function deleteCase(id: string): Promise<{
    data: {
        ok: boolean;
    };
}>;
export {};
//# sourceMappingURL=case.service.d.ts.map