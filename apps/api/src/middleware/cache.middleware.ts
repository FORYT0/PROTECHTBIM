import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/redis';

/**
 * Cache middleware factory
 * Caches GET request responses in Redis
 * 
 * @param keyGenerator - Function to generate cache key from request
 * @param ttl - Time to live in seconds
 * 
 * @example
 * app.get('/api/v1/projects/:id',
 *   cacheMiddleware((req) => `project:${req.params.id}`, 3600),
 *   projectController.getProject
 * );
 */
export const cacheMiddleware = (
  keyGenerator: (req: Request) => string,
  ttl: number
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = keyGenerator(req);

      // Try to get from cache
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        console.log(`Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`Cache MISS: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = function (data: any) {
        // Cache the response asynchronously (don't wait)
        cache.set(cacheKey, data, ttl).catch((err) => {
          console.error(`Failed to cache response for ${cacheKey}:`, err);
        });

        // Send the response
        return originalJson(data);
      };

      return next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      return next();
    }
  };
};

/**
 * Cache invalidation middleware
 * Invalidates cache keys based on request
 * Use this for POST, PUT, PATCH, DELETE requests
 * 
 * @param keyGenerator - Function to generate cache keys to invalidate
 * 
 * @example
 * app.patch('/api/v1/projects/:id',
 *   invalidateCacheMiddleware((req) => [`project:${req.params.id}`, `project:${req.params.id}:*`]),
 *   projectController.updateProject
 * );
 */
export const invalidateCacheMiddleware = (
  keyGenerator: (req: Request) => string | string[]
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to invalidate cache after successful response
      res.json = function (data: any) {
        // Only invalidate on successful responses (2xx status codes)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const keys = keyGenerator(req);
          const keysArray = Array.isArray(keys) ? keys : [keys];

          // Invalidate cache asynchronously (don't wait)
          Promise.all(
            keysArray.map((key) => {
              if (key.includes('*')) {
                return cache.delPattern(key);
              }
              return cache.del(key);
            })
          ).catch((err) => {
            console.error('Failed to invalidate cache:', err);
          });
        }

        // Send the response
        return originalJson(data);
      };

      return next();
    } catch (error) {
      console.error('Cache invalidation middleware error:', error);
      // Continue without invalidation on error
      return next();
    }
  };
};

/**
 * Session authentication middleware
 * Checks if user is authenticated via session
 * 
 * @example
 * app.get('/api/v1/profile', requireAuth, profileController.getProfile);
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  return next();
};

/**
 * Role-based authorization middleware
 * Checks if user has required role
 * 
 * @param allowedRoles - Array of allowed role names
 * 
 * @example
 * app.delete('/api/v1/projects/:id',
 *   requireAuth,
 *   requireRole(['admin', 'project_manager']),
 *   projectController.deleteProject
 * );
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session || !req.session.role) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.session.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    return next();
  };
};
