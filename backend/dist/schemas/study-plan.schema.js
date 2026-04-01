import { z } from 'zod';
export const completeStudyPlanTaskSchema = z.object({
    completedCount: z.number().int().min(0).optional(),
    score: z.number().min(0).max(100).optional(),
    timeSpentSeconds: z.number().int().min(0).default(0),
});
//# sourceMappingURL=study-plan.schema.js.map