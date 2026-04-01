type PaginationInput = string | number | undefined;
export declare function paginationParams(page?: PaginationInput, limit?: PaginationInput): {
    skip: number;
    take: number;
    page: number;
    limit: number;
};
export declare function totalPages(total: number, limit: number): number;
export declare function paginationMeta(total: number, page: number, limit: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
};
export declare function shuffleInPlace<T>(arr: T[]): T[];
export {};
//# sourceMappingURL=helpers.d.ts.map