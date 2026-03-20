# Deployment Fix Notes

## Issues Resolved - February 23, 2026

This document outlines the critical fixes applied to get the PROTECHT BIM application running successfully.

---

## 1. CORS Configuration Fix

**Problem:** The API was sending multiple origins in the `Access-Control-Allow-Origin` header, causing browser CORS errors:
```
The 'Access-Control-Allow-Origin' header contains multiple values 'http://localhost:8081,http://localhost:3001,http://localhost:5173', but only one is allowed.
```

**Root Cause:** The CORS middleware was configured to accept an array of origins, which resulted in all origins being sent in the response header.

**Solution:** Modified `apps/api/src/main.ts` to use a dynamic origin function that returns only the requesting origin:

```typescript
// BEFORE (Incorrect)
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3001',
  credentials: true,
}));

// AFTER (Correct)
const allowedOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || ['http://localhost:3001', 'http://localhost:8081'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

**Environment Variables Updated:**
- `.env`: Added `http://localhost:8081` to CORS_ORIGIN
- `.env.local`: Added `http://localhost:8081` to CORS_ORIGIN
- `apps/api/.env`: Set to `http://localhost:8081,http://localhost:3001,http://localhost:5173`

---

## 2. Redis Authentication Fix

**Problem:** Redis client was attempting to authenticate with an empty password, causing connection errors:
```
ERR AUTH <password> called without any password configured for the default user
```

**Root Cause:** The Redis configuration was passing an empty string as password when `REDIS_PASSWORD` was set to `''`.

**Solution:** Modified `apps/api/src/config/redis.ts` to conditionally include password only when it's not empty:

```typescript
// BEFORE
export const getRedisConfig = () => {
  const password = process.env.REDIS_PASSWORD || undefined;
  return {
    socket: { host, port, reconnectStrategy },
    password,  // This was sending empty string
    database: db,
  };
};

// AFTER
export const getRedisConfig = () => {
  const password = process.env.REDIS_PASSWORD;
  return {
    socket: { host, port, reconnectStrategy },
    // Only include password if it's not empty
    ...(password && password.trim() !== '' ? { password } : {}),
    database: db,
  };
};
```

---

## 3. Database Password Configuration

**Problem:** Database authentication was failing due to password mismatch between docker-compose and existing database.

**Solution:** Updated `docker-compose.yml` to use consistent passwords:
- PostgreSQL: `postgres123`
- Redis: `redis123`

```yaml
postgres:
  environment:
    POSTGRES_PASSWORD: postgres123

redis:
  command: redis-server --requirepass redis123
  healthcheck:
    test: ['CMD', 'redis-cli', '-a', 'redis123', 'ping']

api:
  environment:
    DATABASE_PASSWORD: postgres123
    REDIS_PASSWORD: 'redis123'
```

---

## 4. TypeORM Entity Fix

**Problem:** WikiPage entity had columns without explicit types, causing TypeORM decorator errors:
```
Column type for WikiPage#title is not defined and cannot be guessed
```

**Solution:** Added explicit column types in `apps/api/src/entities/WikiPage.ts`:

```typescript
// BEFORE
@Column()
title!: string;

@Column()
slug!: string;

// AFTER
@Column('varchar', { length: 255 })
title!: string;

@Column('varchar', { length: 255 })
slug!: string;
```

---

## 5. Migration Order Fix

**Problem:** `CreateSprintBurndown` migration was failing because it referenced the `sprints` table before it was created:
```
error: relation "sprints" does not exist
```

**Root Cause:** Migration timestamps were out of order:
- `1704300000000-CreateSprintBurndown.ts` (ran 3rd)
- `1704400000000-CreateSprints.ts` (ran 4th)

**Solution:** Renamed the sprint burndown migration file to run after sprints:
- From: `apps/api/src/migrations/1704300000000-CreateSprintBurndown.ts`
- To: `apps/api/src/migrations/1704500001000-CreateSprintBurndown.ts`

Updated the class name accordingly:
```typescript
export class CreateSprintBurndown1704500001000 implements MigrationInterface
```

---

## 6. React Component Cleanup Fix

**Problem:** Layout component was trying to call `unsubscribeMention()` but the notification service's `on()` method returns `void`:
```
TypeError: unsubscribeMention is not a function
```

**Solution:** Modified `apps/web/src/components/Layout.tsx` to use proper cleanup with `off()`:

```typescript
// BEFORE
const unsubscribeMention = notificationService.on('comment:mentioned', (payload) => {
  // handler
});

return () => {
  unsubscribeMention(); // Error: not a function
};

// AFTER
const handleMention = (payload: any) => {
  // handler
};

notificationService.on('comment:mentioned', handleMention);

return () => {
  notificationService.off('comment:mentioned', handleMention);
};
```

---

## Running the Application

After these fixes, the application can be started with:

```bash
# Start all services with Docker Compose
docker-compose up --build

# Or start services individually
docker-compose up postgres redis  # Infrastructure
docker-compose up api             # API server
```

The application will be available at:
- **Web App:** http://localhost:8081
- **API:** http://localhost:3000
- **API Health:** http://localhost:3000/health

---

## Database Setup

Migrations are run automatically when the API container starts. To run them manually:

```bash
docker exec -w /app/apps/api protecht-bim-api node --import tsx scripts/run-migrations.ts
```

All 14 migrations should complete successfully:
1. InitialUserAuthentication
2. SeedDefaultRolesAndPermissions
3. CreateProjectHierarchy
4. CreateWorkPackages
5. CreateWorkCalendars
6. CreateBaselines
7. CreateBoards
8. CreateSprints
9. CreateTimeEntries
10. CreateSprintBurndown
11. CreateCommentsTable
12. CreateActivityLogsTable
13. AddWeeklyCapacityToUser
14. CreateAttachments

---

## Testing

To verify the fixes:

1. **Test CORS:**
```powershell
$response = curl -Method OPTIONS -Uri "http://localhost:3000/api/v1/projects" -Headers @{"Origin"="http://localhost:8081"; "Access-Control-Request-Method"="GET"}
$response.Headers["Access-Control-Allow-Origin"]
# Should return: http://localhost:8081
```

2. **Test Registration:**
```powershell
$body = @{email="test@example.com";password="Test123!";name="Test User"} | ConvertTo-Json
curl -Method POST -Uri "http://localhost:3000/api/v1/auth/register" -Headers @{"Content-Type"="application/json"} -Body $body
# Should return: 201 Created with user data
```

3. **Access Web App:**
- Navigate to http://localhost:8081
- Register a new account
- Login and verify all features work

---

## Key Takeaways

1. **CORS must return a single origin** - Use a function to dynamically select the requesting origin
2. **Redis password handling** - Only include password in config if it's not empty
3. **TypeORM decorators** - Always specify explicit column types for clarity
4. **Migration order matters** - Ensure foreign key references are created after their target tables
5. **React cleanup** - Use proper unsubscribe patterns matching the library's API

---

## Files Modified

- `apps/api/src/main.ts` - CORS configuration
- `apps/api/src/config/redis.ts` - Redis authentication
- `apps/api/src/entities/WikiPage.ts` - Column type definitions
- `apps/api/src/migrations/1704500001000-CreateSprintBurndown.ts` - Migration order
- `apps/web/src/components/Layout.tsx` - Event listener cleanup
- `docker-compose.yml` - Database passwords and CORS origins
- `.env`, `.env.local`, `apps/api/.env` - Environment variables

---

**Status:** ✅ All issues resolved - Application running successfully
**Date:** February 23, 2026
