import { redis } from '../config/redis.js';

export const CACHE_KEYS = {
  specialties: 'cache:specialties',
  examDates: 'cache:exam-dates',
  phrases: 'cache:phrases',
  stats: (userId: string) => `cache:stats:${userId}`,
  studyPlanToday: (userId: string) => `cache:study-plan:today:${userId}`,
  studyPlanImpact: (userId: string) => `cache:study-plan:impact:${userId}`,
} as const;

export class CacheService {
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  }

  async set(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  /** Uses KEYS — fine for MVP; prefer SCAN in production */
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  }
}

export const cacheService = new CacheService();
