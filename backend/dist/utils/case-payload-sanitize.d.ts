import type { CaseTextFormat } from '@prisma/client';
import type { z } from 'zod';
import type { createCaseSchema, updateCaseSchema } from '../schemas/case.schema.js';
type CreateCase = z.infer<typeof createCaseSchema>;
type UpdateCase = z.infer<typeof updateCaseSchema>;
export declare function sanitizeCreateCasePayload(input: CreateCase): CreateCase;
export declare function sanitizeUpdateCasePayload(input: UpdateCase, existingFormat: CaseTextFormat): UpdateCase;
export {};
//# sourceMappingURL=case-payload-sanitize.d.ts.map