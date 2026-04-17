import { z } from 'zod';
export const listCommunityThreadsQuerySchema = z.object({
    specialtyId: z.string().uuid().optional(),
    sort: z.enum(['recent', 'pinned']).default('recent'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const createCommunityThreadSchema = z.object({
    title: z.string().trim().min(5).max(160),
    body: z.string().trim().min(10).max(5000),
    specialtyId: z.string().uuid().optional().nullable(),
});
export const createCommunityPostSchema = z.object({
    body: z.string().trim().min(2).max(5000),
    parentPostId: z.string().uuid().optional().nullable(),
});
export const moderateCommunityPostSchema = z.object({
    isHidden: z.boolean(),
});
//# sourceMappingURL=community.schema.js.map