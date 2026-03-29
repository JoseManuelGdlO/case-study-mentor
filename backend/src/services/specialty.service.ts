import { prisma } from '../config/database.js';
import { cacheService, CACHE_KEYS } from './cache.service.js';

const TTL = 60 * 60;

export async function getSpecialtyTree() {
  const cached = await cacheService.get<unknown[]>(CACHE_KEYS.specialties);
  if (cached) return { data: cached };

  const rows = await prisma.specialty.findMany({
    orderBy: { name: 'asc' },
    include: { areas: { orderBy: { name: 'asc' } } },
  });

  const data = rows.map((s) => ({
    id: s.id,
    name: s.name,
    subcategories: s.areas.map((a) => ({
      id: a.id,
      name: a.name,
      categoryId: s.id,
    })),
  }));

  await cacheService.set(CACHE_KEYS.specialties, data, TTL);
  return { data };
}

export async function invalidateSpecialtyCache(): Promise<void> {
  await cacheService.invalidate('cache:specialties*');
}
