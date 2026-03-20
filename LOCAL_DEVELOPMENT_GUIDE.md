# Local Development Deployment - Run API Locally Against Docker Databases

This deployment uses:
- **PostgreSQL 15**: Docker container on localhost:5432
- **Redis 7**: Docker container on localhost:6379  
- **API**: Running locally with `npm run dev` or built version
- **Frontend**: Can be served locally with `npm run dev` from apps/web

## Prerequisites

- Node.js 22+ installed locally
- Docker running with postgres and redis containers

## Database Setup

### Verify Databases Running

```bash
# Check PostgreSQL
docker exec protecht-postgres-prod psql -U protecht_admin -d protecht_bim_prod -c "SELECT 1"

# Check Redis
docker exec protecht-redis-prod redis-cli -a redis_secure_password_2024 ping
```

Both should respond successfully.

## API Setup & Run

### 1. Set Environment Variables

Use `.env.local` (already created):

```bash
# On Linux/Mac
export $(cat .env.local | grep -v '^#' | xargs)

# On Windows PowerShell
Get-Content .env.local | Where-Object {$_ -notmatch '^#'} | ForEach-Object {
    $name, $value = $_.split('=')
    if ($name) { [Environment]::SetEnvironmentVariable($name, $value) }
}
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Database Migrations

```bash
# From apps/api
cd apps/api
npm run migrate:local
```

Or run migrations for the entire monorepo:

```bash
npm run migrate:local
```

### 4. Start the API

**Option A: Development Mode** (with hot reload)
```bash
npm run dev -- apps/api
```

**Option B: Built Production** (faster)
```bash
npm run build -- apps/api
node apps/api/dist/main.js
```

The API will start on `http://localhost:3000`

## Frontend Setup & Run

```bash
cd apps/web
npm install
npm run dev
```

The frontend will start on `http://localhost:5173` (Vite default)

## Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### API Status

```bash
curl http://localhost:3000/api/status
```

### Database Connection

```bash
# From container
docker exec protecht-postgres-prod psql -U protecht_admin -d protecht_bim_prod -c "SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema='public';"
```

## Complete Local Stack

To run everything locally:

**Terminal 1 - Databases**
```bash
docker-compose -f docker-compose.production.yml up postgres redis
```

**Terminal 2 - API**
```bash
export $(cat .env.local | grep -v '^#' | xargs)
npm run build -- apps/api
node apps/api/dist/main.js
```

**Terminal 3 - Frontend**
```bash
cd apps/web
npm run dev
```

Access:
- Frontend: http://localhost:5173
- API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Stopping

```bash
# Stop API (Ctrl+C in terminal)
# Stop Frontend (Ctrl+C in terminal)

# Stop Databases
docker-compose -f docker-compose.production.yml down
```

## Environment Variables Reference

Key variables in `.env.local`:

```
DB_HOST=localhost           # Connect to Docker container via localhost
DB_PORT=5432
DB_NAME=protecht_bim_prod
DB_USER=protecht_admin
DB_PASSWORD=protecht_secure_password_2024

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password_2024

API_PORT=3000               # API listens on this port
NODE_ENV=development        # Use development mode
```

## Troubleshooting

### Cannot connect to PostgreSQL
```bash
# Check if container is running
docker ps | grep postgres

# Check if port is accessible
nc -zv localhost 5432  # Linux/Mac
Test-NetConnection -ComputerName localhost -Port 5432  # Windows
```

### Cannot connect to Redis
```bash
# Test connection
docker exec protecht-redis-prod redis-cli -a redis_secure_password_2024 ping
```

### API fails to start
```bash
# Check logs
docker logs protecht-postgres-prod
docker logs protecht-redis-prod

# Run migrations manually
cd apps/api
npm run migrate:local
```

### Port already in use
```bash
# Find process using port
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows
```
