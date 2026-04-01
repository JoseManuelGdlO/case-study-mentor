export declare const CACHE_KEYS: {
    readonly specialties: "cache:specialties";
    readonly examDates: "cache:exam-dates";
    readonly phrases: "cache:phrases";
    readonly stats: (userId: string) => string;
    readonly studyPlanToday: (userId: string) => string;
    readonly studyPlanImpact: (userId: string) => string;
};
export declare class CacheService {
    get<T>(key: string): Promise<T | null>;
    set(key: string, data: unknown, ttlSeconds: number): Promise<void>;
    /** Uses KEYS — fine for MVP; prefer SCAN in production */
    invalidate(pattern: string): Promise<void>;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.service.d.ts.map