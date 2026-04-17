import { z } from 'zod';
export declare const generateExamSchema: z.ZodObject<{
    language: z.ZodEnum<["es", "en"]>;
    mode: z.ZodEnum<["simulation", "study"]>;
    specialtyIds: z.ZodArray<z.ZodString, "many">;
    areaIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    questionCount: z.ZodNumber;
    questionFilter: z.ZodDefault<z.ZodEnum<["all", "unanswered", "answered"]>>;
    adaptiveMode: z.ZodDefault<z.ZodBoolean>;
    predictionSpecialtyId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mode: "simulation" | "study";
    adaptiveMode: boolean;
    language: "es" | "en";
    questionCount: number;
    questionFilter: "all" | "unanswered" | "answered";
    specialtyIds: string[];
    areaIds: string[];
    predictionSpecialtyId?: string | undefined;
}, {
    mode: "simulation" | "study";
    language: "es" | "en";
    questionCount: number;
    specialtyIds: string[];
    adaptiveMode?: boolean | undefined;
    questionFilter?: "all" | "unanswered" | "answered" | undefined;
    areaIds?: string[] | undefined;
    predictionSpecialtyId?: string | undefined;
}>;
export declare const examAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    selectedOptionId: z.ZodNullable<z.ZodString>;
    responseTimeSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    questionId: string;
    selectedOptionId: string | null;
    responseTimeSeconds?: number | undefined;
}, {
    questionId: string;
    selectedOptionId: string | null;
    responseTimeSeconds?: number | undefined;
}>;
export declare const examTimeSchema: z.ZodObject<{
    timeSpentSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeSpentSeconds?: number | undefined;
}, {
    timeSpentSeconds?: number | undefined;
}>;
export declare const submitExamFeedbackSchema: z.ZodObject<{
    difficulty: z.ZodEnum<["easy", "medium", "hard"]>;
    rating: z.ZodNumber;
    comment: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    difficulty: "easy" | "medium" | "hard";
    rating: number;
    comment?: string | null | undefined;
}, {
    difficulty: "easy" | "medium" | "hard";
    rating: number;
    comment?: string | null | undefined;
}>;
//# sourceMappingURL=exam.schema.d.ts.map