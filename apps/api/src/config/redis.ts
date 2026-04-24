import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export const CacheKeys = {
  project: (projectId: string) => `project:${projectId}`,
  projectWorkPackages: (projectId: string) => `project:${projectId}:work_packages`,
  projectGantt: (projectId: string) => `project:${projectId}:gantt`,
  modelThumbnail: (modelId: string) => `model:${modelId}:thumbnail`,
  modelElements: (modelId: string) => `model:${modelId}:elements`,
  modelGeometry: (modelId: string, elementId: string) => `model:${modelId}:geometry:${elementId}`,
  userPermissions: (userId: string) => `user:${userId}:permissions`,
  userNotifications: (userId: string) => `user:${userId}:notifications`,
  session: (sessionId: string) => `session:${sessionId}`,
} as const;

export const CacheTTL = {
  PROJECT: 3600,
  WORK_PACKAGES: 300,
  GANTT: 300,
  MODEL_THUMBNAIL: 86400,
  MODEL_ELEMENTS: 3600,
  MODEL_GEOMETRY: 86400,
  USER_PERMISSIONS: 900,
  USER_NOTIFICATIONS: 300,
  SESSION: 86400,
} as const;

export const initializeRedis = async (): Promise<RedisClientType | null> => {
  if (redisClient) return redisClient;

  const host     = process.env.REDIS_HOST || 'localhost';
  const port     = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD;
  const db       = parseInt(process.env.REDIS_DB || '0', 10);
  const useTLS   = process.env.REDIS_TLS === 'true' || process.env.REDIS_URL?.startsWith('rediss://');

  // Support full connection URL (e.g. rediss://... from Upstash)
  const redisUrl = process.env.REDIS_URL;

  let config: any;

  if (redisUrl) {
    config = {
      url: redisUrl,
      socket: { tls: redisUrl.startsWith('rediss://'), rejectUnauthorized: false },
    };
  } else {
    config = {
      socket: {
        host,
        port,
        tls: useTLS,
        rejectUnauthorized: false, // Required for Upstash self-signed
        reconnectStrategy: (retries: number) => Math.min(retries * 50, 3000),
      },
      ...(password && password.trim() !== '' ? { password } : {}),
      database: db,
    };
  }

  redisClient = createClient(config);

  redisClient.on('error', (err) => console.error('Redis error:', err.message));
  redisClient.on('connect', () => console.log('✅ Redis connected'));
  redisClient.on('ready', () => console.log('✅ Redis ready'));

  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis connection timeout (5s)')), 5000)
    );
    await Promise.race([redisClient.connect(), timeout]);
    console.log(`🔗 Redis at ${redisUrl || `${host}:${port}`} (TLS: ${useTLS})`);
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis unavailable — caching disabled:', (error as Error).message);
    redisClient = null;
    return null;
  }
};

export const getRedisClient = (): RedisClientType | null => redisClient;

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    try { await redisClient.quit(); } catch (_) {}
    redisClient = null;
    console.log('Redis connection closed');
  }
};

// ─── Cache helpers (all gracefully no-op when Redis is unavailable) ─

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const c = getRedisClient();
      if (!c) return null;
      const v = await c.get(key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const c = getRedisClient();
      if (!c) return;
      const s = JSON.stringify(value);
      ttl ? await c.setEx(key, ttl, s) : await c.set(key, s);
    } catch {}
  },

  async del(key: string): Promise<void> {
    try {
      const c = getRedisClient();
      if (!c) return;
      await c.del(key);
    } catch {}
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const c = getRedisClient();
      if (!c) return;
      const keys = await c.keys(pattern);
      if (keys.length > 0) await c.del(keys);
    } catch {}
  },

  async exists(key: string): Promise<boolean> {
    try {
      const c = getRedisClient();
      if (!c) return false;
      return (await c.exists(key)) === 1;
    } catch { return false; }
  },

  async expire(key: string, ttl: number): Promise<void> {
    try {
      const c = getRedisClient();
      if (!c) return;
      await c.expire(key, ttl);
    } catch {}
  },
};

export const invalidateCache = {
  async project(projectId: string): Promise<void> {
    await cache.delPattern(`project:${projectId}*`);
  },
  async workPackages(projectId: string): Promise<void> {
    await cache.del(CacheKeys.projectWorkPackages(projectId));
    await cache.del(CacheKeys.projectGantt(projectId));
  },
  async model(modelId: string): Promise<void> {
    await cache.delPattern(`model:${modelId}*`);
  },
  async userPermissions(userId: string): Promise<void> {
    await cache.del(CacheKeys.userPermissions(userId));
  },
};
