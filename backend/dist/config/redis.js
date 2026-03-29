import { Redis } from 'ioredis';
import { env } from './env.js';
export const redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
});
redis.on('error', (err) => {
    console.error('Redis error:', err.message);
});
export async function connectRedis() {
    await redis.connect();
}
//# sourceMappingURL=redis.js.map