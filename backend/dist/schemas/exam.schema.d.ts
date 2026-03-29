import { z } from 'zod';
export declare const generateExamSchema: z.ZodObject<{
    language: z.ZodEnum<["es", "en"]>;
    mode: z.ZodEnum<["simulation", "study"]>;
    specialtyIds: z.ZodArray<z.ZodString, "many">;
    areaIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    questionCount: z.ZodNumber;
    questionFilter: z.ZodDefault<z.ZodEnum<["all", "unanswered", "answered"]>>;
}, "strip", z.ZodTypeAny, {
    mode: "simulation" | "study";
    language: "es" | "en";
    questionCount: number;
    questionFilter: "all" | "unanswered" | "answered";
    specialtyIds: string[];
    areaIds: string[];
}, {
    mode: "simulation" | "study";
    language: "es" | "en";
    questionCount: number;
    specialtyIds: string[];
    questionFilter?: "all" | "unanswered" | "answered" | undefined;
    areaIds?: string[] | undefined;
}>;
export declare const examAnswerSchema: z.ZodObject<{
    questionId: z.ZodString;
    selectedOptionId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    questionId: string;
    selectedOptionId: string | null;
}, {
    questionId: string;
    selectedOptionId: string | null;
}>;
export declare const examTimeSchema: z.ZodObject<{
    timeSpentSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeSpentSeconds?: number | undefined;
}, {
    timeSpentSeconds?: number | undefined;
}>;
//# sourceMappingURL=exam.schema.d.ts.map