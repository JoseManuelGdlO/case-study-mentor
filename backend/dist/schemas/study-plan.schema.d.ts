import { z } from 'zod';
export declare const completeStudyPlanTaskSchema: z.ZodObject<{
    completedCount: z.ZodOptional<z.ZodNumber>;
    score: z.ZodOptional<z.ZodNumber>;
    timeSpentSeconds: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    timeSpentSeconds: number;
    score?: number | undefined;
    completedCount?: number | undefined;
}, {
    score?: number | undefined;
    timeSpentSeconds?: number | undefined;
    completedCount?: number | undefined;
}>;
export declare const upsertWellbeingTodaySchema: z.ZodObject<{
    mood: z.ZodEnum<["very_low", "low", "neutral", "good", "great"]>;
    anxietyLevel: z.ZodNumber;
    focusLevel: z.ZodNumber;
    sleepHours: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    plannedStudyMinutes: z.ZodDefault<z.ZodNumber>;
    completedStudyMinutes: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    mood: "very_low" | "low" | "neutral" | "good" | "great";
    anxietyLevel: number;
    focusLevel: number;
    plannedStudyMinutes: number;
    completedStudyMinutes: number;
    sleepHours?: number | null | undefined;
    notes?: string | null | undefined;
}, {
    mood: "very_low" | "low" | "neutral" | "good" | "great";
    anxietyLevel: number;
    focusLevel: number;
    sleepHours?: number | null | undefined;
    plannedStudyMinutes?: number | undefined;
    completedStudyMinutes?: number | undefined;
    notes?: string | null | undefined;
}>;
export declare const createWellbeingInterventionSchema: z.ZodObject<{
    kind: z.ZodEnum<["breathing", "pomodoro", "break_reset", "grounding", "stretch"]>;
    durationMinutes: z.ZodDefault<z.ZodNumber>;
    completed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    completed: boolean;
    kind: "breathing" | "pomodoro" | "break_reset" | "grounding" | "stretch";
    durationMinutes: number;
}, {
    kind: "breathing" | "pomodoro" | "break_reset" | "grounding" | "stretch";
    completed?: boolean | undefined;
    durationMinutes?: number | undefined;
}>;
//# sourceMappingURL=study-plan.schema.d.ts.map