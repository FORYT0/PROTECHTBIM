import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

/**
 * Cache key naming conventions for PROTECHT BIM
 * Following the design document specifications
 */
export const CacheKeys = {
  // Project-related keys
  project: (projectId: string) => `project:${projectId}`,
  projectWorkPackages: (projectId: string) => `project:${projectId}:work_packages`,
  projectGantt: (projectId: string) => `project:${projectId}:gantt`,
  
  // Model-related keys
  modelThumbnail: (modelId: string) => `model:${modelId}:thumbnail`,
  modelElements: (modelId: string) => `model:${modelId}:elements`,
  modelGeometry: (modelId: string, elementId: string) => `model:${modelId}:geometry:${elementId}`,
  
  // User-related keys
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userNotifications: (userId: string) => `user:${userId}:notifications`,
  
  // Session keys
  session: (sessionId: string) => `session:${sessionId}`,
} as const;

/**
 * Cache TTL (Time To Live) values in seconds
 */
export const CacheTTL = {
  PROJECT: 3600,              // 1 hour
  WORK_PACKAGES: 300,         // 5 minutes
  GANTT: 300,                 // 5 minutes
  MODEL_THUMBNAIL: 86400,     // 24 hours
  MODEL_ELEMENTS: 3600,       // 1 hour
  MODEL_GEOMETRY: 86400,      // 24 hours
  USER_PERMISSIONS: 900,      // 15 minutes
  USER_NOTIFICATIONS: 300,    // 5 minutes
  SESSION: 86400,             // 24 hours
} as const;

/**
 * Redis connection configuration with retry logic
 */
export const getRedisConfig = () => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;
  const db = parseInt(process.env.REDIS_DB || '0', 10);

  return {
    socket: {
      host,
      port,
      reconnectStrategy: (retries: number) => {
        // Exponential backoff with max delay of 3 seconds
        const delay = Math.min(retries * 50, 3000);
        console.log(`Redis reconnection attempt ${retries}, waiting ${delay}ms`);
        return delay;
      },
    },
    // Only include password if it's not empty
    ...(password && password.trim() !== '' ? { password } : {}),
    database: db,
  };
};

/**
 * Initialize Redis client with connection and error handling
 * Redis is optional - if connection fails, the API will continue without caching
 */
export const initializeRedis = async (): Promise<RedisClientType | null> => {
  if (redisClient) {
    return redisClient;
  }

  const config = getRedisConfig();
  redisClient = createClient(config);

  // Error handling
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis client connected');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis client ready');
  });

  redisClient.on('reconnecting', () => {
    console.log('🔄 Redis client reconnecting...');
  });

  redisClient.on('end', () => {
    console.log('❌ Redis client connection closed');
  });

  // Connect to Redis with timeout
  try {
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log(`🔗 Connected to Redis at ${config.socket.host}:${config.socket.port}`);
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Failed to connect to Redis - continuing without caching:', error instanceof Error ? error.message : error);
    console.warn('⚠️  Redis features (caching, sessions) will be disabled');
    redisClient = null;
    return null;
  }
};

/**
 * Get the Redis client instance
 * Returns null if Redis is not connected
 */
export const getRedisClient = (): RedisClientType | null => {
  return redisClient;
};

/**
 * Close Redis connection gracefully
 */
export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('Redis connection closed');
  }
};

/**
 * Cache helper functions
 * All functions gracefully handle Redis being unavailable
 */
export const cache = {
  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getRedisClient();
      if (!client) return null;
      
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) return;
      
      const serialized = JSON.stringify(value);
      if (ttl) {
        await client.setEx(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  },

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) return;
      
      await client.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  },

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) return;
      
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  },

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = getRedisClient();
      if (!client) return false;
      
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  },

  /**
   * Set expiration time for a key
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      const client = getRedisClient();
      if (!client) return;
      
      await client.expire(key, ttl);
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
    }
  },
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  /**
   * Invalidate project-related caches
   */
  async project(projectId: string): Promise<void> {
    await cache.delPattern(`project:${projectId}*`);
  },

  /**
   * Invalidate work package caches for a project
   */
  async workPackages(projectId: string): Promise<void> {
    await cache.del(CacheKeys.projectWorkPackages(projectId));
    await cache.del(CacheKeys.projectGantt(projectId));
  },

  /**
   * Invalidate model-related caches
   */
  async model(modelId: string): Promise<void> {
    await cache.delPattern(`model:${modelId}*`);
  },

  /**
   * Invalidate user permission cache
   */
  async userPermissions(userId: string): Promise<void> {
    await cache.del(CacheKeys.userPermissions(userId));
  },
};
