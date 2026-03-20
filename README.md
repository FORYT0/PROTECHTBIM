# PROTECHT BIM

A comprehensive construction project management platform with advanced Building Information Modeling (BIM) integration.

## Overview

PROTECHT BIM combines enterprise-grade project management capabilities with BIM coordination tools, enabling construction teams to manage projects from portfolio planning through execution while maintaining tight integration with 3D models, clash detection, and construction sequencing.

## Phase 1 Status: ✅ Complete

Phase 1 core project management features have been successfully implemented:
- ✅ Authentication and user management (JWT, RBAC)
- ✅ Project hierarchy (Portfolio, Program, Project)
- ✅ Work package management (CRUD, relations, watchers)
- ✅ Frontend UI (React, responsive design)
- ✅ API documentation (OpenAPI/Swagger)
- ✅ 211/268 tests passing (57 require PostgreSQL database)

See [PHASE_1_COMPLETION_SUMMARY.md](PHASE_1_COMPLETION_SUMMARY.md) for detailed completion report.

## Technology Stack

- **Frontend**: React 18 with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express and TypeScript
- **Database**: PostgreSQL 14+ with TypeORM
- **Cache**: Redis 7+ for sessions and caching
- **Message Queue**: RabbitMQ for event-driven architecture (Phase 2)
- **Storage**: MinIO (S3-compatible) for file storage (Phase 2)
- **BIM Processing**: IfcOpenShell for IFC parsing (Phase 3)
- **Testing**: Jest for backend, Vitest for frontend

## Project Structure

```
protecht-bim/
├── apps/                    # Application packages
│   ├── api/                # Backend API service
│   │   ├── src/            # Source code
│   │   ├── openapi.yaml    # API documentation
│   │   └── README.md       # Backend setup guide
│   └── web/                # Frontend React application
│       ├── src/            # Source code
│       └── README.md       # Frontend setup guide
├── libs/                    # Shared libraries
│   └── shared-types/       # TypeScript types and interfaces
├── .kiro/                   # Kiro specs and documentation
│   └── specs/protecht-bim/
│       ├── requirements.md # Feature requirements
│       ├── design.md       # System design
│       └── tasks.md        # Implementation tasks
├── ENVIRONMENT_VARIABLES.md # Environment configuration guide
├── PHASE_1_COMPLETION_SUMMARY.md # Phase 1 completion report
├── docker-compose.yml      # Docker services configuration
└── README.md               # This file
```

## Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **PostgreSQL** 14.x or higher
- **Redis** 7.x or higher
- **Docker** (optional, recommended for development)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

Start all services with one command:

```bash
# Start PostgreSQL, Redis, and all services
docker-compose up

# Access the application:
# - Frontend: http://localhost:3001
# - Backend API: http://localhost:3000
# - API Docs: http://localhost:3000/api-docs
```

### Option 2: Manual Setup

#### 1. Install Dependencies

```bash
# Install all dependencies
npm install
```

#### 2. Set Up Environment Variables

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your configuration

# Frontend
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your configuration
```

See [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) for complete configuration guide.

#### 3. Start PostgreSQL and Redis

```bash
# Using Docker
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=protecht_bim \
  postgres:14

docker run -d --name redis -p 6379:6379 redis:7
```

#### 4. Run Database Migrations

```bash
cd apps/api
npm run migration:run
```

#### 5. Start the Applications

```bash
# Terminal 1: Start backend
cd apps/api
npm run dev

# Terminal 2: Start frontend
cd apps/web
npm run dev
```

Access the application:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

## Development

### Running Tests

```bash
# Backend tests
cd apps/api
npm test

# Frontend tests
cd apps/web
npm test

# Run with coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Building for Production

```bash
# Build backend
cd apps/api
npm run build

# Build frontend
cd apps/web
npm run build
```

## Documentation

### Getting Started
- [Backend Setup Guide](apps/api/README.md) - Complete backend setup and API documentation
- [Frontend Setup Guide](apps/web/README.md) - Complete frontend setup and development guide
- [Environment Variables](ENVIRONMENT_VARIABLES.md) - Comprehensive environment configuration guide

### Project Documentation
- [Phase 1 Completion Summary](PHASE_1_COMPLETION_SUMMARY.md) - Phase 1 deliverables and status
- [Requirements Document](.kiro/specs/protecht-bim/requirements.md) - Feature requirements and acceptance criteria
- [Design Document](.kiro/specs/protecht-bim/design.md) - System architecture and design
- [Implementation Tasks](.kiro/specs/protecht-bim/tasks.md) - Detailed implementation plan

### API Documentation
- [OpenAPI Specification](apps/api/openapi.yaml) - Complete API documentation
- Interactive API Docs: http://localhost:3000/api-docs (when server is running)

### Testing
- [Integration Test Report](apps/api/INTEGRATION_TEST_REPORT.md) - Phase 1 test results

## Architecture

### System Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│  React Web  │
│     App     │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────┐     ┌──────────────┐
│  Express    │────▶│  PostgreSQL  │
│  API Server │     │   Database   │
└──────┬──────┘     └──────────────┘
       │
       ▼
┌─────────────┐
│    Redis    │
│    Cache    │
└─────────────┘
```

### Technology Decisions

**Backend:**
- **Node.js + TypeScript**: Type safety and modern JavaScript features
- **Express.js**: Mature, well-documented web framework
- **TypeORM**: Type-safe database access with migrations
- **PostgreSQL**: Robust relational database with JSONB support
- **Redis**: Fast caching and session storage
- **JWT**: Stateless authentication

**Frontend:**
- **React 18**: Modern component-based UI framework
- **TypeScript**: Type safety and better developer experience
- **Vite**: Fast build tool with HMR
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/change-password` - Change password

### Projects
- `GET /api/v1/projects` - List projects (with filtering)
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project details
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project
- `POST /api/v1/projects/:id/transition-phase` - Transition lifecycle phase

### Work Packages
- `GET /api/v1/work_packages` - List work packages (with filtering)
- `POST /api/v1/work_packages` - Create work package
- `GET /api/v1/work_packages/:id` - Get work package details
- `PATCH /api/v1/work_packages/:id` - Update work package
- `DELETE /api/v1/work_packages/:id` - Delete work package
- `POST /api/v1/work_packages/:id/watchers` - Add watcher
- `GET /api/v1/work_packages/:id/watchers` - List watchers
- `DELETE /api/v1/work_packages/:id/watchers/:user_id` - Remove watcher
- `POST /api/v1/work_packages/:id/relations` - Create relation
- `GET /api/v1/work_packages/:id/relations` - List relations
- `DELETE /api/v1/work_package_relations/:id` - Delete relation

See [openapi.yaml](apps/api/openapi.yaml) for complete API documentation.

## Features

### Phase 1 (Complete)
- ✅ User authentication and authorization (JWT, RBAC)
- ✅ Project hierarchy (Portfolio → Program → Project)
- ✅ Project lifecycle management
- ✅ Work package management (Task, Milestone, Phase, Feature, Bug)
- ✅ Work package relations and dependencies
- ✅ Work package watchers
- ✅ Responsive web interface
- ✅ API documentation (OpenAPI/Swagger)

### Phase 2 (Planned)
- 📅 Gantt chart visualization
- 📅 Kanban boards and sprint management
- 📅 Time tracking and cost management
- 📅 Real-time notifications (WebSocket)
- 📅 File attachments and versioning
- 📅 Activity feeds and collaboration
- 📅 Wiki and documentation

### Phase 3 (Planned)
- 🔮 3D BIM model viewer
- 🔮 BCF issue management
- 🔮 Clash detection visualization
- 🔮 Model-based task assignment

### Phase 4-6 (Future)
- 🔮 4D construction sequencing
- 🔮 5D cost estimation
- 🔮 Mobile applications
- 🔮 Advanced integrations

## Troubleshooting

### Database Connection Error

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

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Ensure Redis is running.

```bash
# Start Redis
docker-compose up redis
```

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Change port in `.env` or kill the process using the port.

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

See individual README files for more troubleshooting tips:
- [Backend Troubleshooting](apps/api/README.md#troubleshooting)
- [Frontend Troubleshooting](apps/web/README.md#troubleshooting)

## Contributing

### Development Workflow

1. Create a feature branch
2. Make changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Format code: `npm run format`
6. Commit with conventional commit message
7. Create pull request

### Commit Message Format

Follow conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test additions or modifications
- `chore:` Build process or auxiliary tool changes

## License

Proprietary - All rights reserved

## Support

For questions, issues, or contributions:

- **Documentation**: See documentation links above
- **Issues**: GitHub Issues
- **Email**: support@protecht-bim.com

## Roadmap

### Current: Phase 1 ✅ Complete
Core project management foundation with authentication, projects, and work packages.

### Next: Phase 2 (Q1 2024)
Advanced scheduling, collaboration, and time tracking features.

### Future: Phase 3-6
BIM integration, 4D/5D visualization, mobile apps, and advanced features.

See [tasks.md](.kiro/specs/protecht-bim/tasks.md) for detailed implementation plan.
