import { z } from 'zod';
export const generateExamSchema = z.object({
    language: z.enum(['es', 'en']),
    mode: z.enum(['simulation', 'study']),
    specialtyIds: z.array(z.string().uuid()).min(1),
    areaIds: z.array(z.string().uuid()).default([]),
    questionCount: z.number().int().min(1).max(500),
    questionFilter: z.enum(['all', 'unanswered', 'answered']).default('all'),
    adaptiveMode: z.boolean().default(false),
    predictionSpecialtyId: z.string().uuid().optional(),
});
export const examAnswerSchema = z.object({
    questionId: z.string().uuid(),
    selectedOptionId: z.string().uuid().nullable(),
    responseTimeSeconds: z.number().int().min(0).optional(),
});
export const examTimeSchema = z.object({
    timeSpentSeconds: z.number().int().min(0).optional(),
});
//# sourceMappingURL=exam.schema.js.map