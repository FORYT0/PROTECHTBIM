# PROTECHT BIM API

Backend API server for PROTECHT BIM - A comprehensive construction project management platform with BIM integration.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Project Structure](#project-structure)
- [Development](#development)
- [Deployment](#deployment)

## Overview

The PROTECHT BIM API provides RESTful endpoints for managing construction projects, work packages, and BIM models. Phase 1 includes:

- **Authentication & Authorization**: JWT-based authentication with role-based access control (RBAC)
- **Project Management**: Three-level hierarchy (Portfolio → Program → Project)
- **Work Package Management**: Tasks, milestones, phases, features, and bugs
- **Relations & Dependencies**: Work package relationships with circular dependency detection
- **Watchers**: User notifications for work package changes

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM
- **Cache**: Redis 7+
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: class-validator
- **Testing**: Jest
- **API Documentation**: OpenAPI 3.0 (Swagger)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14.x or higher
- **Redis** 7.x or higher
- **Docker** (optional, for containerized development)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd protecht-bim
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install API dependencies
cd apps/api
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp apps/api/.env.example apps/api/.env
```

Edit `.env` with your configuration (see [Configuration](#configuration) section).

## Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in `apps/api/` with the following variables:

#### Database Configuration

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=protecht_bim
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

#### Redis Configuration

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

#### JWT Configuration

```env
# IMPORTANT: Change these secrets in production!
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRES_IN=3600                    # Access token expiry (seconds)
JWT_REFRESH_EXPIRES_IN=604800          # Refresh token expiry (seconds)
```

#### Session Configuration

```env
# IMPORTANT: Change this secret in production!
SESSION_SECRET=your-session-secret-min-32-characters
SESSION_TTL=86400                      # Session TTL (seconds)
COOKIE_DOMAIN=                         # Leave empty for localhost
```

#### Application Configuration

```env
NODE_ENV=development                   # development | production | test
API_PORT=3000
LOG_LEVEL=debug                        # error | warn | info | debug
```

#### CORS Configuration

```env
CORS_ORIGIN=http://localhost:3001      # Frontend URL
```

#### File Upload Configuration

```env
MAX_FILE_SIZE=104857600                # 100MB in bytes
ALLOWED_FILE_TYPES=.ifc,.rvt,.nwd,.pdf,.png,.jpg,.jpeg
```

#### Storage Configuration (MinIO/S3)

```env
STORAGE_ENDPOINT=localhost:9000
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=protecht-bim
STORAGE_USE_SSL=false
```

#### Message Queue Configuration (RabbitMQ)

```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

### Security Best Practices

⚠️ **IMPORTANT**: For production deployments:

1. **Generate Strong Secrets**: Use cryptographically secure random strings (min 32 characters)
   ```bash
   # Generate a secure secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use Environment-Specific Configs**: Never commit `.env` files to version control
3. **Enable HTTPS**: Set `STORAGE_USE_SSL=true` for production
4. **Restrict CORS**: Set `CORS_ORIGIN` to your production frontend URL
5. **Use Strong Database Passwords**: Change default PostgreSQL credentials

## Running the Application

### Option 1: Using Docker Compose (Recommended)

Start all services (PostgreSQL, Redis, API):

```bash
# From project root
docker-compose up
```

The API will be available at `http://localhost:3000`

### Option 2: Manual Setup

#### 1. Start PostgreSQL and Redis

```bash
# Using Docker
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=protecht_bim \
  postgres:14

docker run -d --name redis -p 6379:6379 redis:7
```

Or install and start them locally.

#### 2. Run Database Migrations

```bash
cd apps/api
npm run migration:run
```

#### 3. Start the API Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run build
npm start
```

The API will be available at `http://localhost:3000`

### Verify Installation

Test the API is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Testing

### Run All Tests

```bash
cd apps/api
npm test
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test Suites

```bash
# Unit tests only (no database required)
npm test -- --testPathIgnorePatterns="integration"

# Integration tests (requires database)
npm test -- integration

# Specific test file
npm test -- auth.routes.test.ts
```

### Test Results

Current test status (Phase 1):
- **Total Tests**: 268
- **Passing**: 211 (78.7%)
- **Failing**: 57 (require PostgreSQL database)

All failures are infrastructure-related (database connection). Core business logic tests pass successfully.

## API Documentation

### OpenAPI/Swagger Documentation

The API is documented using OpenAPI 3.0 specification.

**View Documentation**:
- OpenAPI YAML: `apps/api/openapi.yaml`
- Interactive Swagger UI: `http://localhost:3000/api-docs` (when server is running)

### API Endpoints Summary

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/change-password` - Change password

#### Projects
- `GET /api/v1/projects` - List projects (with filtering)
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `POST /api/v1/projects/:id/transition-phase` - Transition lifecycle phase

#### Work Packages
- `GET /api/v1/work_packages` - List work packages (with filtering)
- `POST /api/v1/work_packages` - Create work package
- `GET /api/v1/work_packages/:id` - Get work package details
- `PATCH /api/v1/work_packages/:id` - Update work package
- `DELETE /api/v1/work_packages/:id` - Delete work package

#### Work Package Watchers
- `GET /api/v1/work_packages/:id/watchers` - List watchers
- `POST /api/v1/work_packages/:id/watchers` - Add watcher
- `DELETE /api/v1/work_packages/:id/watchers/:user_id` - Remove watcher

#### Work Package Relations
- `GET /api/v1/work_packages/:id/relations` - List relations
- `POST /api/v1/work_packages/:id/relations` - Create relation
- `DELETE /api/v1/work_package_relations/:id` - Delete relation

#### RBAC (Role-Based Access Control)
- `GET /api/v1/roles` - List roles
- `POST /api/v1/roles` - Create role (Admin only)
- `GET /api/v1/permissions` - List permissions
- `POST /api/v1/users/:userId/roles` - Assign roles (Admin only)
- `GET /api/v1/users/:userId/permissions` - Get user permissions

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```bash
curl -H "Authorization: Bearer <your_jwt_token>" \
  http://localhost:3000/api/v1/projects
```

### Example API Usage

#### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "John Doe"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

Response includes `accessToken` and `refreshToken`.

#### 3. Create a Project

```bash
curl -X POST http://localhost:3000/api/v1/projects \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Building Construction",
    "description": "New office building project",
    "status": "active",
    "lifecycle_phase": "planning"
  }'
```

#### 4. Create a Work Package

```bash
curl -X POST http://localhost:3000/api/v1/work_packages \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "<project_uuid>",
    "type": "task",
    "subject": "Foundation excavation",
    "description": "Excavate foundation to 3m depth",
    "priority": "high",
    "start_date": "2024-02-01",
    "due_date": "2024-02-15"
  }'
```

## Database

### Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and authentication
- **roles** - User roles for RBAC
- **permissions** - Granular permissions
- **portfolios** - Top-level project grouping
- **programs** - Mid-level project grouping
- **projects** - Individual projects
- **work_packages** - Tasks, milestones, features, bugs
- **work_package_relations** - Dependencies between work packages
- **work_package_watchers** - User subscriptions to work packages

### Migrations

Migrations are managed using TypeORM.

#### Create a New Migration

```bash
npm run migration:create -- -n MigrationName
```

#### Run Migrations

```bash
npm run migration:run
```

#### Revert Last Migration

```bash
npm run migration:revert
```

#### Generate Migration from Entity Changes

```bash
npm run migration:generate -- -n MigrationName
```

### Database Backup

```bash
# Backup
pg_dump -U postgres protecht_bim > backup.sql

# Restore
psql -U postgres protecht_bim < backup.sql
```

## Project Structure

```
apps/api/
├── src/
│   ├── config/           # Configuration files
│   │   ├── data-source.ts
│   │   └── test-data-source.ts
│   ├── entities/         # TypeORM entities
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── WorkPackage.ts
│   │   └── ...
│   ├── repositories/     # Data access layer
│   │   ├── UserRepository.ts
│   │   ├── ProjectRepository.ts
│   │   └── ...
│   ├── services/         # Business logic
│   │   ├── auth.service.ts
│   │   ├── ProjectService.ts
│   │   ├── WorkPackageService.ts
│   │   └── ...
│   ├── routes/           # API route handlers
│   │   ├── auth.routes.ts
│   │   ├── projects.routes.ts
│   │   ├── work-packages.routes.ts
│   │   └── ...
│   ├── middleware/       # Express middleware
│   │   ├── auth.middleware.ts
│   │   └── error.middleware.ts
│   ├── migrations/       # Database migrations
│   ├── __tests__/        # Test files
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── integration/
│   └── main.ts           # Application entry point
├── openapi.yaml          # OpenAPI specification
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment file
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Git Hooks

Pre-commit hooks run linting and tests automatically.

### Adding a New Feature

1. **Create Entity** (if needed): `src/entities/NewEntity.ts`
2. **Create Repository**: `src/repositories/NewEntityRepository.ts`
3. **Create Service**: `src/services/NewEntityService.ts`
4. **Create Routes**: `src/routes/new-entity.routes.ts`
5. **Add Tests**: `src/__tests__/services/NewEntityService.test.ts`
6. **Update OpenAPI**: Add endpoints to `openapi.yaml`
7. **Run Tests**: `npm test`
8. **Create Migration**: `npm run migration:generate -- -n AddNewEntity`

### Debugging

#### VS Code Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug API",
      "runtimeArgs": ["-r", "ts-node/register"],
      "args": ["${workspaceFolder}/apps/api/src/main.ts"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

#### Logging

The application uses console logging with configurable levels:

```typescript
// Set LOG_LEVEL in .env: error | warn | info | debug
console.error('Error message');
console.warn('Warning message');
console.info('Info message');
console.debug('Debug message');
```

## Deployment

### Production Build

```bash
cd apps/api
npm run build
```

Build output: `dist/`

### Docker Deployment

#### Build Docker Image

```bash
docker build -f apps/api/Dockerfile.prod -t protecht-bim-api:latest .
```

#### Run Container

```bash
docker run -d \
  --name protecht-api \
  -p 3000:3000 \
  --env-file apps/api/.env.production \
  protecht-bim-api:latest
```

### Environment-Specific Configurations

Create separate `.env` files:
- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Health Checks

The API provides health check endpoints for monitoring:

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check (includes database, Redis)
curl http://localhost:3000/health/detailed
```

### Performance Considerations

1. **Database Connection Pooling**: Configured in `data-source.ts`
2. **Redis Caching**: Cache frequently accessed data
3. **Query Optimization**: Use indexes, avoid N+1 queries
4. **Rate Limiting**: Implement rate limiting for production
5. **Compression**: Enable gzip compression

### Monitoring

Recommended monitoring tools:
- **Application**: PM2, New Relic, Datadog
- **Database**: pgAdmin, PostgreSQL logs
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Metrics**: Prometheus + Grafana

## Troubleshooting

### Common Issues

#### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running and credentials in `.env` are correct.

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Start PostgreSQL
docker-compose up postgres
```

#### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Ensure Redis is running.

```bash
# Start Redis
docker-compose up redis
```

#### Migration Errors

```
Error: relation "users" already exists
```

**Solution**: Check migration history and revert if needed.

```bash
npm run migration:revert
npm run migration:run
```

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Change `API_PORT` in `.env` or kill the process using port 3000.

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

## Support

For issues, questions, or contributions:

- **Documentation**: See `docs/` folder
- **Issues**: GitHub Issues
- **Email**: support@protecht-bim.com

## License

Proprietary - All rights reserved

## Phase 2 Roadmap

Upcoming features in Phase 2:
- Gantt chart API with scheduling engine
- Baseline and calendar features
- Agile boards and sprint management
- Time tracking and cost management
- Real-time collaboration with WebSockets
- File attachments and wiki

See `tasks.md` for detailed implementation plan.
