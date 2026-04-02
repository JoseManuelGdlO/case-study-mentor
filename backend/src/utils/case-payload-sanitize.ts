import type { CaseTextFormat } from '@prisma/client';
import type { z } from 'zod';
import type { createCaseSchema, updateCaseSchema } from '../schemas/case.schema.js';
import { sanitizeTextField } from './html-sanitize.js';

type CreateCase = z.infer<typeof createCaseSchema>;
type UpdateCase = z.infer<typeof updateCaseSchema>;

function sanitizeQuestionLike<Q extends { text: string; summary: string; bibliography: string; hint: string; options: Array<{ text: string; explanation: string }> }>(
  q: Q,
  format: CaseTextFormat
): Q {
  return {
    ...q,
    text: sanitizeTextField(q.text, format),
    summary: sanitizeTextField(q.summary, format),
    bibliography: sanitizeTextField(q.bibliography, format),
    hint: sanitizeTextField(q.hint, format),
    options: q.options.map((o) => ({
      ...o,
      text: sanitizeTextField(o.text, format),
      explanation: sanitizeTextField(o.explanation, format),
    })),
  };
}

export function sanitizeCreateCasePayload(input: CreateCase): CreateCase {
  const format = input.textFormat;
  return {
    ...input,
    text: sanitizeTextField(input.text, format),
    questions: input.questions.map((q) => sanitizeQuestionLike(q, format)),
  };
}

export function sanitizeUpdateCasePayload(input: UpdateCase, existingFormat: CaseTextFormat): UpdateCase {
  const format = input.textFormat ?? existingFormat;
  const out: UpdateCase = { ...input };
  if (input.text != null) out.text = sanitizeTextField(input.text, format);
  if (input.questions) {
    out.questions = input.questions.map((q) => sanitizeQuestionLike(q, format));
  }
  return out;
}
