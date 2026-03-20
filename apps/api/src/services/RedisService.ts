/**
 * REDIS SERVICE
 * 
 * Wrapper around Redis cache utilities for cleaner API
 */

import { cache, getRedisClient } from '../config/redis';

export class RedisService {
  async get<T>(key: string): Promise<T | null> {
    try {
      return await cache.get<T>(key);
    } catch (error) {
      console.error(`RedisService.get error for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await cache.set(key, value, ttl);
    } catch (error) {
      console.error(`RedisService.set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await cache.del(key);
    } catch (error) {
      console.error(`RedisService.delete error for key ${key}:`, error);
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      await cache.delPattern(pattern);
    } catch (error) {
      console.error(`RedisService.deletePattern error for pattern ${pattern}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return await cache.exists(key);
    } catch (error) {
      console.error(`RedisService.exists error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await cache.expire(key, ttl);
    } catch (error) {
      console.error(`RedisService.expire error for key ${key}:`, error);
    }
  }

  isConnected(): boolean {
    return getRedisClient() !== null;
  }
}

export const createRedisService = (): RedisService => {
  return new RedisService();
};
