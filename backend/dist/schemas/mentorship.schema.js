import { z } from 'zod';
export const createMentorshipRequestSchema = z.object({
    topic: z.string().trim().min(5).max(160),
    context: z.string().trim().max(5000).optional().nullable(),
    availability: z.string().trim().max(2000).optional().nullable(),
    specialtyId: z.string().uuid().optional().nullable(),
});
export const listMentorshipRequestsQuerySchema = z.object({
    status: z.enum(['pending', 'accepted', 'rejected', 'scheduled', 'completed', 'cancelled']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const updateMentorshipStatusSchema = z.object({
    status: z.enum(['accepted', 'rejected', 'scheduled', 'completed', 'cancelled']),
    mentorId: z.string().uuid().optional().nullable(),
    statusNote: z.string().trim().max(2000).optional().nullable(),
    scheduledAt: z.string().datetime().optional().nullable(),
    externalMeetingUrl: z.string().url().max(2048).optional().nullable(),
});
//# sourceMappingURL=mentorship.schema.js.map