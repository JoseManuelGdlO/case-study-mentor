import { z } from 'zod';

const optionSchema = z.object({
  label: z.string(),
  text: z.string(),
  imageUrl: z.string().optional().nullable(),
  feedbackImageUrl: z.string().optional().nullable(),
  isCorrect: z.boolean(),
  explanation: z.string(),
});

const difficultyLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

const questionSchema = z.object({
  text: z.string(),
  imageUrl: z.string().optional().nullable(),
  feedbackImageUrl: z.string().optional().nullable(),
  summary: z.string(),
  bibliography: z.string(),
  difficultyLevel: difficultyLevelSchema.default(2),
  cognitiveCompetence: z.boolean().default(false),
  previousEnarmPresence: z.boolean().default(false),
  hint: z.string().default(''),
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
  textFormat: z.enum(['plain', 'html']).default('html'),
  imageUrl: z.string().optional().nullable(),
  generatedByIa: z.boolean().optional().default(false),
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
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const bulkDeleteCasesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});
