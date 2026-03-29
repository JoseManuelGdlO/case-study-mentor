import { z } from 'zod';
const optionSchema = z.object({
    label: z.string(),
    text: z.string(),
    imageUrl: z.string().optional().nullable(),
    isCorrect: z.boolean(),
    explanation: z.string(),
});
const questionSchema = z.object({
    text: z.string(),
    imageUrl: z.string().optional().nullable(),
    summary: z.string(),
    bibliography: z.string(),
    difficulty: z.enum(['low', 'medium', 'high']).default('medium'),
    orderIndex: z.number().int().min(0).optional(),
    options: z.array(optionSchema).length(4),
});
const labSchema = z.object({
    name: z.string(),
    value: z.string(),
    unit: z.string(),
    normalRange: z.string(),
});
export const createCaseSchema = z.object({
    specialtyId: z.string().uuid(),
    areaId: z.string().uuid(),
    topic: z.string().min(1),
    language: z.enum(['es', 'en']).default('es'),
    text: z.string().min(1),
    imageUrl: z.string().optional().nullable(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    questions: z.array(questionSchema).min(1),
    labResults: z.array(labSchema).optional().default([]),
});
export const updateCaseSchema = createCaseSchema.partial().extend({
    questions: z.array(questionSchema).min(1).optional(),
    labResults: z.array(labSchema).optional(),
});
export const listCasesQuerySchema = z.object({
    specialty: z.string().uuid().optional(),
    area: z.string().uuid().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
});
//# sourceMappingURL=case.schema.js.map