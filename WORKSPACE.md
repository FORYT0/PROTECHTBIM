# PROTECHT BIM Workspace

## Monorepo Structure

This project uses **Nx** for monorepo management, providing:
- Efficient task execution with caching
- Dependency graph visualization
- Consistent tooling across projects
- Incremental builds

## Workspace Layout

```
protecht-bim/
├── apps/                           # Applications
│   ├── api/                       # Backend API (Node.js + Express)
│   ├── web/                       # Frontend (React + TypeScript)
│   └── bim-processor/             # BIM Processing Service (Python/Node.js)
│
├── libs/                           # Shared Libraries
│   ├── shared-types/              # TypeScript types and interfaces
│   │   ├── src/
│   │   │   ├── models/           # Domain models
│   │   │   ├── api/              # API interfaces
│   │   │   └── common/           # Common types
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── project.json
│   │
│   └── shared-utils/              # Common utilities
│       ├── src/
│       │   ├── validation.ts     # Validation functions
│       │   ├── date-utils.ts     # Date utilities
│       │   └── string-utils.ts   # String utilities
│       ├── package.json
│       ├── tsconfig.json
│       └── project.json
│
├── tools/                          # Build Tools & Scripts
│   ├── scripts/                   # Deployment scripts
│   └── generators/                # Code generators
│
├── .kiro/                          # Kiro Specifications
│   └── specs/
│       └── protecht-bim/
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
│
├── Configuration Files
├── nx.json                         # Nx workspace configuration
├── tsconfig.base.json             # Base TypeScript configuration
├── package.json                    # Root package.json with workspaces
├── .eslintrc.json                 # ESLint configuration
├── .prettierrc                    # Prettier configuration
├── docker-compose.yml             # Local development services
└── .env.example                   # Environment variables template
```

## TypeScript Configuration

### Strict Mode Enabled

All projects use TypeScript strict mode with the following flags:
- `strict: true` - Enable all strict type checking options
- `noImplicitAny: true` - Error on expressions with implied 'any' type
- `strictNullChecks: true` - Enable strict null checks
- `strictFunctionTypes: true` - Enable strict checking of function types
- `strictBindCallApply: true` - Enable strict 'bind', 'call', and 'apply' methods
- `strictPropertyInitialization: true` - Ensure class properties are initialized
- `noImplicitThis: true` - Error on 'this' expressions with implied 'any' type
- `alwaysStrict: true` - Parse in strict mode and emit "use strict"
- `noUnusedLocals: true` - Report errors on unused locals
- `noUnusedParameters: true` - Report errors on unused parameters
- `noImplicitReturns: true` - Report error when not all code paths return a value
- `noFallthroughCasesInSwitch: true` - Report errors for fallthrough cases in switch

### Path Aliases

Configured in `tsconfig.base.json`:
```json
{
  "@protecht-bim/shared-types": ["libs/shared-types/src/index.ts"],
  "@protecht-bim/shared-utils": ["libs/shared-utils/src/index.ts"]
}
```

Usage:
```typescript
import { WorkPackage, Project } from '@protecht-bim/shared-types';
import { isValidEmail, formatDate } from '@protecht-bim/shared-utils';
```

## Code Quality Tools

### ESLint

- **Parser**: @typescript-eslint/parser
- **Plugins**: @typescript-eslint, import
- **Extends**: eslint:recommended, plugin:@typescript-eslint/recommended, prettier
- **Rules**:
  - Unused variables error (with _ prefix exception)
  - Import order enforcement with alphabetical sorting
  - No explicit 'any' (warning)

### Prettier

- **Semi**: true
- **Single Quote**: true
- **Print Width**: 100
- **Tab Width**: 2
- **Trailing Comma**: es5
- **Arrow Parens**: always

## Nx Commands

### Running Tasks

```bash
# Run a task for a specific project
npx nx <target> <project>
npx nx build api
npx nx test shared-types
npx nx lint web

# Run a task for all projects
npx nx run-many --target=<target> --all
npx nx run-many --target=build --all
npx nx run-many --target=test --all

# Run a task for specific projects
npx nx run-many --target=test --projects=api,shared-types

# Run affected projects only (based on git changes)
npx nx affected --target=build
npx nx affected --target=test
```

### Workspace Management

```bash
# View dependency graph
npx nx graph

# Show project information
npx nx show project api

# List all projects
npx nx show projects

# Clear Nx cache
npx nx reset

# Run Nx daemon
npx nx daemon
```

### Caching

Nx caches task outputs for:
- `build` - Build artifacts
- `test` - Test results
- `lint` - Lint results

Cache is stored in `.nx/cache` and shared across the workspace.

## Development Workflow

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Services

```bash
# Start PostgreSQL, Redis, MinIO, RabbitMQ
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Run Applications

```bash
# Start all applications
npm run dev

# Or start specific applications
npx nx dev api
npx nx dev web
```

### 4. Run Tests

```bash
# Run all tests
npm test

# Run tests for specific project
npx nx test api

# Run tests in watch mode
npx nx test api --watch
```

### 5. Lint and Format

```bash
# Lint all projects
npm run lint

# Format all files
npm run format

# Check formatting
npm run format:check
```

## Adding New Projects

### Adding an Application

```bash
# Generate a new application
npx nx g @nx/node:application apps/my-app

# Or manually create:
# 1. Create apps/my-app directory
# 2. Add package.json
# 3. Add tsconfig.json
# 4. Add project.json with Nx configuration
# 5. Update tsconfig.base.json paths if needed
```

### Adding a Library

```bash
# Generate a new library
npx nx g @nx/js:library libs/my-lib

# Or manually create:
# 1. Create libs/my-lib directory
# 2. Add package.json
# 3. Add tsconfig.json
# 4. Add project.json with Nx configuration
# 5. Update tsconfig.base.json paths
```

## Shared Libraries

### @protecht-bim/shared-types

Contains all TypeScript types and interfaces:
- **models/**: Domain models (Project, WorkPackage, User, BIM)
- **api/**: API request/response interfaces
- **common/**: Common types (Pagination, ApiResponse, etc.)

### @protecht-bim/shared-utils

Contains utility functions:
- **validation**: Email, UUID, number validation
- **date-utils**: Date formatting, parsing, calculations
- **string-utils**: String manipulation, slugify, mention extraction

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:
- `DATABASE_*`: PostgreSQL connection
- `REDIS_*`: Redis connection
- `JWT_*`: JWT configuration
- `STORAGE_*`: MinIO/S3 configuration
- `RABBITMQ_*`: RabbitMQ connection
- `API_PORT`, `WEB_PORT`: Application ports

## Next Steps

1. **Phase 1**: Implement core project management features
   - Set up API service (apps/api)
   - Set up web application (apps/web)
   - Implement authentication and user management
   - Implement project and work package management

2. **Phase 2**: Advanced scheduling and collaboration
   - Gantt chart implementation
   - Agile boards and sprint management
   - Time tracking and cost management

3. **Phase 3**: BIM integration
   - Set up BIM processor service
   - Implement 3D model viewing
   - BCF issue management

See [tasks.md](.kiro/specs/protecht-bim/tasks.md) for detailed implementation plan.
