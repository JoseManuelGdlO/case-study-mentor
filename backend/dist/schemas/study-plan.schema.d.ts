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
//# sourceMappingURL=study-plan.schema.d.ts.map