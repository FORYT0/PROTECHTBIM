# Task 1.3 Completion: Set up Redis for Caching and Sessions

## Task Overview

**Task:** 1.3 Set up Redis for caching and sessions  
**Requirements:** 20.6  
**Status:** ✅ Completed

## Implementation Summary

This task implements Redis for caching and session management in the PROTECHT BIM API, following the design specifications from the requirements document.

## Deliverables

### 1. Redis Client Library Installation ✅

Installed the following packages:
- `redis` (v4.x) - Official Redis client for Node.js
- `express-session` - Session middleware for Express
- `connect-redis` - Redis session store for Express
- `@types/express-session` - TypeScript definitions

```bash
npm install redis express-session connect-redis --workspace=@protecht-bim/api
npm install --save-dev @types/express-session --workspace=@protecht-bim/api
```

### 2. Redis Configuration with Retry Logic ✅

**File:** `apps/api/src/config/redis.ts`

Features implemented:
- **Connection Configuration**: Configurable host, port, password, and database
- **Retry Logic**: Exponential backoff with max delay of 3 seconds
- **Error Handling**: Comprehensive error and connection event handlers
- **Graceful Shutdown**: Proper cleanup on application termination
- **Connection Pooling**: Automatic connection management by redis client

Key functions:
```typescript
initializeRedis()    // Initialize Redis connection
getRedisClient()     // Get Redis client instance
closeRedis()         // Close connection gracefully
```

Retry strategy:
```typescript
reconnectStrategy: (retries: number) => {
  const delay = Math.min(retries * 50, 3000);
  return delay;
}
```

### 3. Cache Key Naming Conventions ✅

**File:** `apps/api/src/config/redis.ts`

Implemented structured naming conventions following the design document:

#### Project Keys
- `project:{projectId}` - Project details (TTL: 1 hour)
- `project:{projectId}:work_packages` - Work package list (TTL: 5 minutes)
- `project:{projectId}:gantt` - Gantt chart data (TTL: 5 minutes)

#### Model Keys
- `model:{modelId}:thumbnail` - Model thumbnail (TTL: 24 hours)
- `model:{modelId}:elements` - Element list (TTL: 1 hour)
- `model:{modelId}:geometry:{elementId}` - Element geometry (TTL: 24 hours)

#### User Keys
- `user:{userId}:permissions` - User permissions (TTL: 15 minutes)
- `user:{userId}:notifications` - Recent notifications (TTL: 5 minutes)

#### Session Keys
- `session:{sessionId}` - User session data (TTL: 24 hours)

All keys are accessible via the `CacheKeys` constant:
```typescript
CacheKeys.project(projectId)
CacheKeys.modelThumbnail(modelId)
CacheKeys.userPermissions(userId)
```

### 4. Session Store Configuration ✅

**File:** `apps/api/src/config/session.ts`

Features implemented:
- **Redis Store**: Uses connect-redis for session storage
- **Session Prefix**: All sessions prefixed with `session:`
- **Security**: HTTP-only cookies, CSRF protection, secure cookies in production
- **TTL Management**: Configurable session timeout (default: 24 hours)
- **Rolling Sessions**: Session expiration resets on each request
- **Custom Session Data**: Extended session interface for user data

Session configuration:
```typescript
{
  store: RedisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 86400000, // 24 hours
    sameSite: 'lax'
  }
}
```

## Additional Features

### Cache Helper Functions

**File:** `apps/api/src/config/redis.ts`

Implemented comprehensive cache utilities:

```typescript
cache.get<T>(key)              // Get cached value
cache.set(key, value, ttl)     // Set cached value with TTL
cache.del(key)                 // Delete cached value
cache.delPattern(pattern)      // Delete keys matching pattern
cache.exists(key)              // Check if key exists
cache.expire(key, ttl)         // Set expiration time
```

### Cache Invalidation Helpers

```typescript
invalidateCache.project(projectId)           // Invalidate project caches
invalidateCache.workPackages(projectId)      // Invalidate work package caches
invalidateCache.model(modelId)               // Invalidate model caches
invalidateCache.userPermissions(userId)      // Invalidate user permissions
```

### Middleware

**File:** `apps/api/src/middleware/cache.middleware.ts`

Created reusable middleware for:
- **Response Caching**: Automatic caching of GET responses
- **Cache Invalidation**: Automatic cache invalidation on mutations
- **Session Authentication**: Check if user is authenticated
- **Role-Based Authorization**: Check user roles and permissions

Example usage:
```typescript
// Cache GET responses
app.get('/api/v1/projects/:id',
  cacheMiddleware((req) => CacheKeys.project(req.params.id), CacheTTL.PROJECT),
  projectController.getProject
);

// Invalidate cache on updates
app.patch('/api/v1/projects/:id',
  invalidateCacheMiddleware((req) => [`project:${req.params.id}*`]),
  projectController.updateProject
);

// Require authentication
app.get('/api/v1/profile',
  requireAuth,
  profileController.getProfile
);

// Require specific role
app.delete('/api/v1/projects/:id',
  requireAuth,
  requireRole(['admin', 'project_manager']),
  projectController.deleteProject
);
```

## Integration

### Main Application

**File:** `apps/api/src/main.ts`

Updated to:
1. Initialize Redis connection on startup
2. Add session middleware after Redis initialization
3. Close Redis connection on graceful shutdown

```typescript
const startServer = async () => {
  await initializeDatabase();
  await initializeRedis();
  app.use(createSessionMiddleware());
  app.listen(port);
};

process.on('SIGTERM', async () => {
  await closeRedis();
  process.exit(0);
});
```

### Environment Configuration

Updated `.env` and `.env.example` with:
```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Session Configuration
SESSION_SECRET=your-session-secret-change-in-production
SESSION_TTL=86400
COOKIE_DOMAIN=
```

## Testing

### Test Script

**File:** `apps/api/scripts/test-redis.ts`

Created comprehensive test script that verifies:
- Redis connection establishment
- Basic cache operations (set, get, delete)
- Cache key naming conventions
- TTL configuration
- Pattern-based deletion
- Error handling

Run tests:
```bash
npm run redis:test --workspace=@protecht-bim/api
```

### Manual Testing

1. Start Redis:
   ```bash
   docker compose up -d redis
   ```

2. Run test script:
   ```bash
   npm run redis:test --workspace=@protecht-bim/api
   ```

3. Start API server:
   ```bash
   npm run dev --workspace=@protecht-bim/api
   ```

Expected console output:
```
✅ Redis client connected
✅ Redis client ready
🔗 Connected to Redis at localhost:6379
🚀 Server is running on http://localhost:3000
```

## Documentation

**File:** `apps/api/REDIS_SETUP.md`

Created comprehensive documentation covering:
- Installation instructions
- Configuration guide
- Cache key naming conventions
- Usage examples
- Cache invalidation strategies
- Session management
- Production considerations
- Troubleshooting guide
- Architecture integration

## Architecture Alignment

This implementation aligns with the design document specifications:

### Caching Strategy (Design Document Section)
✅ Implements all specified cache keys and TTLs
✅ Follows naming conventions exactly as specified
✅ Supports cache invalidation patterns

### Session Management
✅ Redis-based session store for horizontal scalability
✅ Secure cookie configuration
✅ Support for distributed sessions across multiple API instances

### Scalability (Requirement 20.6)
✅ Supports horizontal scaling with shared Redis instance
✅ Connection pooling and retry logic
✅ Graceful degradation on Redis failures

## Files Created/Modified

### Created Files
1. `apps/api/src/config/redis.ts` - Redis configuration and utilities
2. `apps/api/src/config/session.ts` - Session store configuration
3. `apps/api/src/middleware/cache.middleware.ts` - Cache and auth middleware
4. `apps/api/scripts/test-redis.ts` - Redis test script
5. `apps/api/REDIS_SETUP.md` - Comprehensive documentation
6. `apps/api/TASK_1.3_COMPLETION.md` - This file

### Modified Files
1. `apps/api/src/main.ts` - Added Redis initialization and session middleware
2. `apps/api/package.json` - Added redis:test script
3. `apps/api/.env` - Added Redis and session configuration
4. `.env.example` - Added Redis and session configuration

## Dependencies Added

```json
{
  "dependencies": {
    "redis": "^4.x",
    "express-session": "^1.x",
    "connect-redis": "^7.x"
  },
  "devDependencies": {
    "@types/express-session": "^1.x"
  }
}
```

## Performance Benefits

1. **Reduced Database Load**: Frequently accessed data cached in Redis
2. **Faster Response Times**: Sub-millisecond cache lookups vs database queries
3. **Scalability**: Distributed caching supports horizontal scaling
4. **Session Management**: Fast session lookups without database queries

## Security Features

1. **Secure Cookies**: HTTP-only, secure flag in production, SameSite protection
2. **Session Secrets**: Configurable session secret for signing cookies
3. **Password Support**: Optional Redis password authentication
4. **TTL Management**: Automatic expiration of cached data

## Next Steps

This implementation is ready for:
1. Integration with authentication endpoints (Task 2.3)
2. Integration with project management APIs (Task 3.2)
3. Integration with work package APIs (Task 4.2)
4. Production deployment with Redis Cluster/Sentinel

## Verification Checklist

- ✅ Redis client library installed
- ✅ Connection configuration with retry logic implemented
- ✅ Cache key naming conventions defined and documented
- ✅ Session store configuration implemented
- ✅ Helper functions for cache operations created
- ✅ Cache invalidation strategies implemented
- ✅ Middleware for caching and authentication created
- ✅ Test script created and documented
- ✅ Environment variables configured
- ✅ Main application integrated
- ✅ Comprehensive documentation written
- ✅ TypeScript compilation successful (no errors)
- ✅ Follows design document specifications
- ✅ Meets requirement 20.6

## Conclusion

Task 1.3 has been successfully completed. The Redis setup provides a robust foundation for caching and session management in the PROTECHT BIM platform, with proper error handling, retry logic, and comprehensive documentation for future development.
