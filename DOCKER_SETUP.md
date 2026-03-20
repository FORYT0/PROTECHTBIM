# Docker Development Environment Setup

This document provides instructions for setting up and using the Docker development environment for PROTECHT BIM.

## Overview

The Docker development environment includes:
- **PostgreSQL 15**: Primary database for application data
- **Redis 7**: Caching and session management
- **MinIO**: S3-compatible object storage for files and BIM models
- **RabbitMQ**: Message broker for event-driven architecture
- **API Service**: Node.js backend with hot-reload enabled

## Prerequisites

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+
- At least 4GB of available RAM
- At least 10GB of available disk space

## Quick Start

### 1. Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f api
```

### 2. Verify Services

Check that all services are healthy:

```bash
docker-compose ps
```

All services should show status as "Up" and health as "healthy".

### 3. Access Services

- **API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO Console**: http://localhost:9001 (credentials: minioadmin/minioadmin)
- **MinIO API**: http://localhost:9000
- **RabbitMQ Management**: http://localhost:15672 (credentials: guest/guest)

### 4. Initialize Database

Run migrations to set up the database schema:

```bash
# Run migrations inside the API container
docker-compose exec api npm run migration:run --workspace=@protecht-bim/api

# Or run from host if you have Node.js installed
cd apps/api
npm run migration:run
```

### 5. Stop Services

```bash
# Stop all services
docker-compose stop

# Stop and remove containers (data persists in volumes)
docker-compose down

# Stop and remove containers AND volumes (deletes all data)
docker-compose down -v
```

## Development Workflow

### Hot Reload

The API service is configured with hot-reload using `tsx watch`. Any changes to source files in `apps/api/src` or `libs/` will automatically restart the server.

**Mounted volumes for hot-reload:**
- `./apps/api/src` → `/app/apps/api/src`
- `./libs` → `/app/libs`

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 api
```

### Executing Commands in Containers

```bash
# Run a command in the API container
docker-compose exec api npm run test --workspace=@protecht-bim/api

# Open a shell in the API container
docker-compose exec api sh

# Run database migrations
docker-compose exec api npm run migration:run --workspace=@protecht-bim/api

# Generate a new migration
docker-compose exec api npm run migration:generate --workspace=@protecht-bim/api -- src/migrations/MigrationName
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d protecht_bim

# Backup database
docker-compose exec postgres pg_dump -U postgres protecht_bim > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres protecht_bim < backup.sql

# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d
docker-compose exec api npm run migration:run --workspace=@protecht-bim/api
```

### Redis Management

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# View all keys
docker-compose exec redis redis-cli KEYS '*'

# Flush all data (WARNING: deletes all cached data)
docker-compose exec redis redis-cli FLUSHALL
```

### MinIO Management

Access the MinIO console at http://localhost:9001 with credentials `minioadmin/minioadmin`.

**Create the application bucket:**

```bash
# Using MinIO client (mc)
docker run --rm --network protecht-bim-network \
  minio/mc alias set myminio http://minio:9000 minioadmin minioadmin

docker run --rm --network protecht-bim-network \
  minio/mc mb myminio/protecht-bim
```

Or use the web console to create a bucket named `protecht-bim`.

## Troubleshooting

### Services Won't Start

**Check Docker resources:**
```bash
docker system df
docker system prune  # Clean up unused resources
```

**Check service logs:**
```bash
docker-compose logs postgres
docker-compose logs redis
docker-compose logs api
```

### API Service Crashes on Startup

**Common causes:**
1. Database not ready - wait for PostgreSQL health check to pass
2. Missing migrations - run `docker-compose exec api npm run migration:run`
3. Port 3000 already in use - stop other services or change port in docker-compose.yml

**Check API logs:**
```bash
docker-compose logs api
```

### Database Connection Issues

**Verify PostgreSQL is running:**
```bash
docker-compose ps postgres
docker-compose exec postgres pg_isready -U postgres
```

**Check connection from API:**
```bash
docker-compose exec api npm run db:verify --workspace=@protecht-bim/api
```

### Hot Reload Not Working

**Verify volume mounts:**
```bash
docker-compose exec api ls -la /app/apps/api/src
```

**Restart the API service:**
```bash
docker-compose restart api
```

### Port Conflicts

If you have services already running on the default ports, modify `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - '5433:5432'  # Change host port
  
  api:
    ports:
      - '3001:3000'  # Change host port
```

### Performance Issues

**Increase Docker resources:**
- Docker Desktop → Settings → Resources
- Recommended: 4GB RAM, 2 CPUs minimum

**Check resource usage:**
```bash
docker stats
```

## Production Deployment

For production deployment, use the production Dockerfile:

```bash
# Build production image
docker build -f apps/api/Dockerfile.prod -t protecht-bim-api:latest .

# Run with production docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

**Production considerations:**
- Use environment-specific secrets (not hardcoded)
- Enable SSL/TLS for all services
- Configure proper backup strategies
- Set up monitoring and logging
- Use orchestration (Kubernetes) for scalability
- Implement proper health checks and restart policies

## Environment Variables

The API service uses the following environment variables (configured in docker-compose.yml):

| Variable | Description | Default (Dev) |
|----------|-------------|---------------|
| `DATABASE_HOST` | PostgreSQL host | postgres |
| `DATABASE_PORT` | PostgreSQL port | 5432 |
| `DATABASE_NAME` | Database name | protecht_bim |
| `DATABASE_USER` | Database user | postgres |
| `DATABASE_PASSWORD` | Database password | postgres |
| `REDIS_HOST` | Redis host | redis |
| `REDIS_PORT` | Redis port | 6379 |
| `JWT_SECRET` | JWT signing secret | dev-secret-key |
| `SESSION_SECRET` | Session signing secret | dev-session-secret |
| `STORAGE_ENDPOINT` | MinIO endpoint | minio:9000 |
| `STORAGE_ACCESS_KEY` | MinIO access key | minioadmin |
| `STORAGE_SECRET_KEY` | MinIO secret key | minioadmin |
| `RABBITMQ_HOST` | RabbitMQ host | rabbitmq |
| `RABBITMQ_PORT` | RabbitMQ port | 5672 |
| `API_PORT` | API server port | 3000 |
| `NODE_ENV` | Environment | development |

## Network Architecture

All services are connected via a custom bridge network `protecht-bim-network`:

```
┌─────────────────────────────────────────────────────────┐
│                  protecht-bim-network                   │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │PostgreSQL│  │  Redis   │  │  MinIO   │            │
│  │  :5432   │  │  :6379   │  │:9000/9001│            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                    │
│       └─────────────┴─────────────┘                    │
│                     │                                  │
│              ┌──────┴──────┐                          │
│              │  RabbitMQ   │                          │
│              │:5672/15672  │                          │
│              └──────┬──────┘                          │
│                     │                                  │
│              ┌──────┴──────┐                          │
│              │  API Service│                          │
│              │    :3000    │                          │
│              └─────────────┘                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
                      │
                      │ (exposed ports)
                      ▼
              Host Machine
```

## Data Persistence

Data is persisted using Docker volumes:

- `postgres_data`: PostgreSQL database files
- `redis_data`: Redis persistence files
- `minio_data`: MinIO object storage
- `rabbitmq_data`: RabbitMQ message queue data

**Backup volumes:**
```bash
# Create backup directory
mkdir -p backups

# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres protecht_bim > backups/db_$(date +%Y%m%d_%H%M%S).sql

# Backup MinIO (using mc client)
docker run --rm --network protecht-bim-network \
  -v $(pwd)/backups:/backups \
  minio/mc mirror myminio/protecht-bim /backups/minio
```

## Health Checks

All services include health checks:

- **PostgreSQL**: `pg_isready` command
- **Redis**: `redis-cli ping` command
- **MinIO**: HTTP health endpoint
- **RabbitMQ**: `rabbitmq-diagnostics ping` command

The API service depends on all other services being healthy before starting.

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)
- [MinIO Documentation](https://min.io/docs/minio/linux/index.html)
- [RabbitMQ Docker Image](https://hub.docker.com/_/rabbitmq)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review service logs: `docker-compose logs [service]`
3. Consult the main project README.md
4. Open an issue in the project repository
