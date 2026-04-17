import { z } from 'zod';
export const completeStudyPlanTaskSchema = z.object({
    completedCount: z.number().int().min(0).optional(),
    score: z.number().min(0).max(100).optional(),
    timeSpentSeconds: z.number().int().min(0).default(0),
});
export const upsertWellbeingTodaySchema = z.object({
    mood: z.enum(['very_low', 'low', 'neutral', 'good', 'great']),
    anxietyLevel: z.number().int().min(1).max(5),
    focusLevel: z.number().int().min(1).max(5),
    sleepHours: z.number().min(0).max(24).optional().nullable(),
    plannedStudyMinutes: z.number().int().min(0).max(1440).default(0),
    completedStudyMinutes: z.number().int().min(0).max(1440).default(0),
    notes: z.string().trim().max(1200).optional().nullable(),
});
export const createWellbeingInterventionSchema = z.object({
    kind: z.enum(['breathing', 'pomodoro', 'break_reset', 'grounding', 'stretch']),
    durationMinutes: z.number().int().min(1).max(120).default(5),
    completed: z.boolean().default(true),
});
//# sourceMappingURL=study-plan.schema.js.map