import { redis } from '../config/redis.js';
export const CACHE_KEYS = {
    specialties: 'cache:specialties',
    examDates: 'cache:exam-dates',
    phrases: 'cache:phrases',
    stats: (userId) => `cache:stats:${userId}`,
};
export class CacheService {
    async get(key) {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    async set(key, data, ttlSeconds) {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
    }
    /** Uses KEYS — fine for MVP; prefer SCAN in production */
    async invalidate(pattern) {
        const keys = await redis.keys(pattern);
        if (keys.length)
            await redis.del(...keys);
    }
}
export const cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map