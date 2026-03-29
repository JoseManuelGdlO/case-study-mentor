import { z } from 'zod';
export declare const createCaseSchema: z.ZodObject<{
    specialtyId: z.ZodString;
    areaId: z.ZodString;
    topic: z.ZodString;
    language: z.ZodDefault<z.ZodEnum<["es", "en"]>>;
    text: z.ZodString;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published", "archived"]>>;
    questions: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        summary: z.ZodString;
        bibliography: z.ZodString;
        difficulty: z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>;
        orderIndex: z.ZodOptional<z.ZodNumber>;
        options: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            text: z.ZodString;
            imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            isCorrect: z.ZodBoolean;
            explanation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficulty: "low" | "medium" | "high";
        imageUrl?: string | null | undefined;
        orderIndex?: number | undefined;
    }, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        difficulty?: "low" | "medium" | "high" | undefined;
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
    status: "draft" | "published" | "archived";
    language: "es" | "en";
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
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficulty: "low" | "medium" | "high";
        imageUrl?: string | null | undefined;
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
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        difficulty?: "low" | "medium" | "high" | undefined;
        orderIndex?: number | undefined;
    }[];
    status?: "draft" | "published" | "archived" | undefined;
    language?: "es" | "en" | undefined;
    imageUrl?: string | null | undefined;
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
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["draft", "published", "archived"]>>>;
} & {
    questions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        summary: z.ZodString;
        bibliography: z.ZodString;
        difficulty: z.ZodDefault<z.ZodEnum<["low", "medium", "high"]>>;
        orderIndex: z.ZodOptional<z.ZodNumber>;
        options: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            text: z.ZodString;
            imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            isCorrect: z.ZodBoolean;
            explanation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }, {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficulty: "low" | "medium" | "high";
        imageUrl?: string | null | undefined;
        orderIndex?: number | undefined;
    }, {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        difficulty?: "low" | "medium" | "high" | undefined;
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
    status?: "draft" | "published" | "archived" | undefined;
    language?: "es" | "en" | undefined;
    specialtyId?: string | undefined;
    areaId?: string | undefined;
    topic?: string | undefined;
    text?: string | undefined;
    imageUrl?: string | null | undefined;
    questions?: {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        difficulty: "low" | "medium" | "high";
        imageUrl?: string | null | undefined;
        orderIndex?: number | undefined;
    }[] | undefined;
    labResults?: {
        value: string;
        name: string;
        unit: string;
        normalRange: string;
    }[] | undefined;
}, {
    status?: "draft" | "published" | "archived" | undefined;
    language?: "es" | "en" | undefined;
    specialtyId?: string | undefined;
    areaId?: string | undefined;
    topic?: string | undefined;
    text?: string | undefined;
    imageUrl?: string | null | undefined;
    questions?: {
        options: {
            isCorrect: boolean;
            text: string;
            label: string;
            explanation: string;
            imageUrl?: string | null | undefined;
        }[];
        text: string;
        summary: string;
        bibliography: string;
        imageUrl?: string | null | undefined;
        difficulty?: "low" | "medium" | "high" | undefined;
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
    page: z.ZodOptional<z.ZodString>;
    limit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "published" | "archived" | undefined;
    specialty?: string | undefined;
    area?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}, {
    status?: "draft" | "published" | "archived" | undefined;
    specialty?: string | undefined;
    area?: string | undefined;
    page?: string | undefined;
    limit?: string | undefined;
}>;
//# sourceMappingURL=case.schema.d.ts.map