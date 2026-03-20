# Redis Setup for PROTECHT BIM

This document describes the Redis configuration for caching and session management in the PROTECHT BIM API.

## Overview

Redis is used for:
- **Caching**: Frequently accessed data (projects, models, user permissions)
- **Session Management**: User session storage with distributed support
- **Performance**: Reducing database load and improving response times

## Installation

Redis client libraries are already installed:
```bash
npm install redis express-session connect-redis --workspace=@protecht-bim/api
```

## Configuration

### Environment Variables

Add the following to your `.env` file:

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

### Starting Redis

Using Docker Compose (recommended):
```bash
docker compose up -d redis
```

Or manually with Docker:
```bash
docker run -d \
  --name protecht-bim-redis \
  -p 6379:6379 \
  redis:7-alpine
```

## Cache Key Naming Conventions

The system follows a structured naming convention for cache keys:

### Project Keys
- `project:{projectId}` - Project details (TTL: 1 hour)
- `project:{projectId}:work_packages` - Work package list (TTL: 5 minutes)
- `project:{projectId}:gantt` - Gantt chart data (TTL: 5 minutes)

### Model Keys
- `model:{modelId}:thumbnail` - Model thumbnail (TTL: 24 hours)
- `model:{modelId}:elements` - Element list (TTL: 1 hour)
- `model:{modelId}:geometry:{elementId}` - Element geometry (TTL: 24 hours)

### User Keys
- `user:{userId}:permissions` - User permissions (TTL: 15 minutes)
- `user:{userId}:notifications` - Recent notifications (TTL: 5 minutes)

### Session Keys
- `session:{sessionId}` - User session data (TTL: 24 hours)

## Usage Examples

### Basic Caching

```typescript
import { cache, CacheKeys, CacheTTL } from './config/redis';

// Set a value
await cache.set(
  CacheKeys.project(projectId),
  projectData,
  CacheTTL.PROJECT
);

// Get a value
const project = await cache.get(CacheKeys.project(projectId));

// Delete a value
await cache.del(CacheKeys.project(projectId));

// Check if exists
const exists = await cache.exists(CacheKeys.project(projectId));
```

### Cache Invalidation

```typescript
import { invalidateCache } from './config/redis';

// Invalidate all project caches
await invalidateCache.project(projectId);

// Invalidate work package caches
await invalidateCache.workPackages(projectId);

// Invalidate model caches
await invalidateCache.model(modelId);

// Invalidate user permissions
await invalidateCache.userPermissions(userId);
```

### Session Management

Sessions are automatically managed by Express middleware:

```typescript
// Access session in route handlers
app.get('/api/v1/profile', (req, res) => {
  if (req.session.userId) {
    // User is authenticated
    const userId = req.session.userId;
    // ... handle request
  }
});

// Set session data
req.session.userId = user.id;
req.session.email = user.email;
req.session.role = user.role;

// Destroy session (logout)
req.session.destroy((err) => {
  if (err) {
    console.error('Session destroy error:', err);
  }
});
```

## Connection and Retry Logic

The Redis client is configured with automatic reconnection:

- **Exponential Backoff**: Retry delay increases with each attempt
- **Max Delay**: Capped at 3 seconds
- **Automatic Reconnection**: Client automatically reconnects on connection loss
- **Error Handling**: Errors are logged but don't crash the application

## Testing

Test the Redis connection:

```bash
npm run redis:test --workspace=@protecht-bim/api
```

This will:
1. Connect to Redis
2. Test basic set/get operations
3. Verify cache key naming conventions
4. Test TTL configuration
5. Test pattern deletion
6. Verify all functionality

Expected output:
```
🧪 Testing Redis connection and functionality...

1. Initializing Redis connection...
✅ Redis initialized successfully

2. Testing basic cache operations...
✅ Set test value: { message: 'Hello Redis!', timestamp: '...' }
✅ Retrieved value: { message: 'Hello Redis!', timestamp: '...' }
✅ Values match!

...

✅ All Redis tests passed!
```

## Cache TTL Values

| Cache Type | TTL | Duration |
|------------|-----|----------|
| PROJECT | 3600s | 1 hour |
| WORK_PACKAGES | 300s | 5 minutes |
| GANTT | 300s | 5 minutes |
| MODEL_THUMBNAIL | 86400s | 24 hours |
| MODEL_ELEMENTS | 3600s | 1 hour |
| MODEL_GEOMETRY | 86400s | 24 hours |
| USER_PERMISSIONS | 900s | 15 minutes |
| USER_NOTIFICATIONS | 300s | 5 minutes |
| SESSION | 86400s | 24 hours |

## Production Considerations

### Security
- Set a strong `REDIS_PASSWORD` in production
- Use TLS/SSL for Redis connections
- Restrict Redis network access to application servers only

### Performance
- Monitor Redis memory usage
- Configure `maxmemory` and eviction policies
- Use Redis Cluster for high availability

### Monitoring
- Track cache hit/miss ratios
- Monitor connection pool usage
- Set up alerts for connection failures

### Scaling
- Use Redis Sentinel for automatic failover
- Consider Redis Cluster for horizontal scaling
- Implement cache warming strategies for critical data

## Troubleshooting

### Connection Issues

If Redis connection fails:

1. Check if Redis is running:
   ```bash
   docker compose ps redis
   ```

2. Test Redis connectivity:
   ```bash
   redis-cli -h localhost -p 6379 ping
   ```

3. Check Redis logs:
   ```bash
   docker compose logs redis
   ```

### Cache Issues

If caching isn't working:

1. Verify Redis is initialized before use
2. Check error logs for Redis client errors
3. Ensure cache keys follow naming conventions
4. Verify TTL values are appropriate

### Session Issues

If sessions aren't persisting:

1. Check `SESSION_SECRET` is set
2. Verify cookie settings (secure, httpOnly, sameSite)
3. Ensure Redis store is properly configured
4. Check browser cookie settings

## Architecture Integration

Redis integrates with the PROTECHT BIM architecture as follows:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────┐
│  API Server │────▶│  Redis   │
└──────┬──────┘     └──────────┘
       │                  ▲
       ▼                  │
┌─────────────┐          │
│ PostgreSQL  │──────────┘
└─────────────┘
   (Cache Invalidation)
```

1. Client requests data from API
2. API checks Redis cache first
3. If cache miss, query PostgreSQL
4. Store result in Redis with TTL
5. Return data to client
6. On data updates, invalidate relevant caches

## References

- [Redis Documentation](https://redis.io/documentation)
- [node-redis Client](https://github.com/redis/node-redis)
- [connect-redis](https://github.com/tj/connect-redis)
- [Express Session](https://github.com/expressjs/session)

## Task Completion

This implementation satisfies task 1.3 requirements:
- ✅ Install Redis client library
- ✅ Configure connection with retry logic
- ✅ Implement cache key naming conventions
- ✅ Set up session store configuration
- ✅ Requirements: 20.6
