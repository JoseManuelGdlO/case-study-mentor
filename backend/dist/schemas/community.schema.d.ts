import { z } from 'zod';
export declare const listCommunityThreadsQuerySchema: z.ZodObject<{
    specialtyId: z.ZodOptional<z.ZodString>;
    sort: z.ZodDefault<z.ZodEnum<["recent", "pinned"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sort: "recent" | "pinned";
    limit: number;
    page: number;
    specialtyId?: string | undefined;
}, {
    sort?: "recent" | "pinned" | undefined;
    specialtyId?: string | undefined;
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const createCommunityThreadSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodString;
    specialtyId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    body: string;
    specialtyId?: string | null | undefined;
}, {
    title: string;
    body: string;
    specialtyId?: string | null | undefined;
}>;
export declare const createCommunityPostSchema: z.ZodObject<{
    body: z.ZodString;
    parentPostId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    body: string;
    parentPostId?: string | null | undefined;
}, {
    body: string;
    parentPostId?: string | null | undefined;
}>;
export declare const moderateCommunityPostSchema: z.ZodObject<{
    isHidden: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    isHidden: boolean;
}, {
    isHidden: boolean;
}>;
//# sourceMappingURL=community.schema.d.ts.map