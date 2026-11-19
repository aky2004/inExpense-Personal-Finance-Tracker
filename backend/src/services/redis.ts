import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 5) {
      console.warn('Redis reconnection failed 5 times, giving up.');
      return null;
    }
    return Math.min(times * 100, 2000);
  },
});

redis.on('connect', () => {
  console.log('Connected to Redis server.');
});

redis.on('error', (err) => {
  console.warn('Redis connection issue:', err.message);
});

// Assignment TTL specifications:
// - User analytics data: 15 minutes (900 seconds)
// - Category lists: 1 hour (3600 seconds)
export const CACHE_TTL = {
  ANALYTICS: 15 * 60, // 900 seconds
  CATEGORIES: 60 * 60, // 3600 seconds
};

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      console.error(`Error getting key ${key} from Redis:`, err);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      const payload = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, payload);
    } catch (err) {
      console.error(`Error setting key ${key} in Redis:`, err);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (err) {
      console.error(`Error deleting key ${key} from Redis:`, err);
    }
  },

  async invalidateUserAnalytics(userId: number): Promise<void> {
    try {
      // Invalidate all analytics caches for this user
      const keys = await redis.keys(`analytics:user:${userId}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Invalidated ${keys.length} analytics cache key(s) for user ${userId}`);
      }
    } catch (err) {
      console.error(`Error invalidating analytics for user ${userId}:`, err);
    }
  },

  async invalidateCategories(): Promise<void> {
    try {
      const keys = await redis.keys('categories:*');
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Invalidated ${keys.length} category cache key(s)`);
      }
    } catch (err) {
      console.error('Error invalidating categories cache:', err);
    }
  },
};
