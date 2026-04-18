import { z } from 'zod';
export declare const createCaseSchema: z.ZodObject<{
    specialtyId: z.ZodString;
    areaId: z.ZodString;
    topic: z.ZodString;
    language: z.ZodDefault<z.ZodEnum<["es", "en"]>>;
    text: z.ZodString;
    textFormat: z.ZodDefault<z.ZodEnum<["plain", "html"]>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    generatedByIa: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published", "archived"]>>;
    questions: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        feedbackImageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        summary: z.ZodString;
        bibliography: z.ZodString;
        difficultyLevel: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>>;
        cognitiveCompetence: z.ZodDefault<z.ZodBoolean>;
        previousEnarmPresence: z.ZodDefault<z.ZodBoolean>;
        hint: z.ZodDefault<z.ZodString>;
        orderIndex: z.ZodOptional<z.ZodNumber>;
        options: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            text: z.ZodString;
            imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            feedbackImageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            isCorrect: z.ZodBoolean;
            explanation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficultyLevel: 1 | 3 | 2;
        cognitiveCompetence: boolean;
        previousEnarmPresence: boolean;
        hint: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        orderIndex?: number | undefined;
    }, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        difficultyLevel?: 1 | 3 | 2 | undefined;
        cognitiveCompetence?: boolean | undefined;
        previousEnarmPresence?: boolean | undefined;
        hint?: string | undefined;
        orderIndex?: number | undefined;
    }>, "many">;
    labResults: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
        unit: z.ZodString;
        normalRange: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }, {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }>, "many">>>;
}, "strip", z.ZodTypeAny, {
    status: "published" | "draft" | "archived";
    language: "es" | "en";
    specialtyId: string;
    areaId: string;
    topic: string;
    text: string;
    textFormat: "plain" | "html";
    generatedByIa: boolean;
    questions: {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficultyLevel: 1 | 3 | 2;
        cognitiveCompetence: boolean;
        previousEnarmPresence: boolean;
        hint: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        orderIndex?: number | undefined;
    }[];
    labResults: {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }[];
    imageUrl?: string | null | undefined;
}, {
    specialtyId: string;
    areaId: string;
    topic: string;
    text: string;
    questions: {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        difficultyLevel?: 1 | 3 | 2 | undefined;
        cognitiveCompetence?: boolean | undefined;
        previousEnarmPresence?: boolean | undefined;
        hint?: string | undefined;
        orderIndex?: number | undefined;
    }[];
    status?: "published" | "draft" | "archived" | undefined;
    language?: "es" | "en" | undefined;
    textFormat?: "plain" | "html" | undefined;
    imageUrl?: string | null | undefined;
    generatedByIa?: boolean | undefined;
    labResults?: {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }[] | undefined;
}>;
export declare const updateCaseSchema: z.ZodObject<{
    specialtyId: z.ZodOptional<z.ZodString>;
    areaId: z.ZodOptional<z.ZodString>;
    topic: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodDefault<z.ZodEnum<["es", "en"]>>>;
    text: z.ZodOptional<z.ZodString>;
    textFormat: z.ZodOptional<z.ZodDefault<z.ZodEnum<["plain", "html"]>>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    generatedByIa: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["draft", "published", "archived"]>>>;
} & {
    questions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        feedbackImageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        summary: z.ZodString;
        bibliography: z.ZodString;
        difficultyLevel: z.ZodDefault<z.ZodUnion<[z.ZodLiteral<1>, z.ZodLiteral<2>, z.ZodLiteral<3>]>>;
        cognitiveCompetence: z.ZodDefault<z.ZodBoolean>;
        previousEnarmPresence: z.ZodDefault<z.ZodBoolean>;
        hint: z.ZodDefault<z.ZodString>;
        orderIndex: z.ZodOptional<z.ZodNumber>;
        options: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            text: z.ZodString;
            imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            feedbackImageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            isCorrect: z.ZodBoolean;
            explanation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficultyLevel: 1 | 3 | 2;
        cognitiveCompetence: boolean;
        previousEnarmPresence: boolean;
        hint: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        orderIndex?: number | undefined;
    }, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        difficultyLevel?: 1 | 3 | 2 | undefined;
        cognitiveCompetence?: boolean | undefined;
        previousEnarmPresence?: boolean | undefined;
        hint?: string | undefined;
        orderIndex?: number | undefined;
    }>, "many">>;
    labResults: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
        unit: z.ZodString;
        normalRange: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }, {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "published" | "draft" | "archived" | undefined;
    language?: "es" | "en" | undefined;
    specialtyId?: string | undefined;
    areaId?: string | undefined;
    topic?: string | undefined;
    text?: string | undefined;
    textFormat?: "plain" | "html" | undefined;
    imageUrl?: string | null | undefined;
    generatedByIa?: boolean | undefined;
    questions?: {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficultyLevel: 1 | 3 | 2;
        cognitiveCompetence: boolean;
        previousEnarmPresence: boolean;
        hint: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        orderIndex?: number | undefined;
    }[] | undefined;
    labResults?: {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }[] | undefined;
}, {
    status?: "published" | "draft" | "archived" | undefined;
    language?: "es" | "en" | undefined;
    specialtyId?: string | undefined;
    areaId?: string | undefined;
    topic?: string | undefined;
    text?: string | undefined;
    textFormat?: "plain" | "html" | undefined;
    imageUrl?: string | null | undefined;
    generatedByIa?: boolean | undefined;
    questions?: {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
            feedbackImageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        feedbackImageUrl?: string | null | undefined;
        difficultyLevel?: 1 | 3 | 2 | undefined;
        cognitiveCompetence?: boolean | undefined;
        previousEnarmPresence?: boolean | undefined;
        hint?: string | undefined;
        orderIndex?: number | undefined;
    }[] | undefined;
    labResults?: {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }[] | undefined;
}>;
export declare const listCasesQuerySchema: z.ZodObject<{
    specialty: z.ZodOptional<z.ZodString>;
    area: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "published", "archived"]>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "published" | "draft" | "archived" | undefined;
    specialty?: string | undefined;
    area?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}, {
    status?: "published" | "draft" | "archived" | undefined;
    specialty?: string | undefined;
    area?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const bulkDeleteCasesSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids: string[];
}, {
    ids: string[];
}>;
//# sourceMappingURL=case.schema.d.ts.map