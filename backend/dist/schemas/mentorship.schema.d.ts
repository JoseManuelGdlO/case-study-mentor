import { z } from 'zod';
export declare const createMentorshipRequestSchema: z.ZodObject<{
    topic: z.ZodString;
    context: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    availability: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    specialtyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    topic: string;
    specialtyId?: string | null | undefined;
    context?: string | null | undefined;
    availability?: string | null | undefined;
}, {
    topic: string;
    specialtyId?: string | null | undefined;
    context?: string | null | undefined;
    availability?: string | null | undefined;
}>;
export declare const listMentorshipRequestsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["pending", "accepted", "rejected", "scheduled", "completed", "cancelled"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
    status?: "pending" | "completed" | "accepted" | "rejected" | "scheduled" | "cancelled" | undefined;
}, {
    status?: "pending" | "completed" | "accepted" | "rejected" | "scheduled" | "cancelled" | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const updateMentorshipStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["accepted", "rejected", "scheduled", "completed", "cancelled"]>;
    statusNote: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    externalMeetingUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "accepted" | "rejected" | "scheduled" | "cancelled";
    statusNote?: string | null | undefined;
    externalMeetingUrl?: string | null | undefined;
    scheduledAt?: string | null | undefined;
}, {
    status: "completed" | "accepted" | "rejected" | "scheduled" | "cancelled";
    statusNote?: string | null | undefined;
    externalMeetingUrl?: string | null | undefined;
    scheduledAt?: string | null | undefined;
}>;
//# sourceMappingURL=mentorship.schema.d.ts.map