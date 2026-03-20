# PostgreSQL Database Setup - Task 1.2

## ✅ Completed Setup

### 1. TypeORM Configuration
- **Location**: `apps/api/src/config/data-source.ts`
- **Features**:
  - PostgreSQL connection with environment variable configuration
  - Connection pooling configured:
    - Max connections: 20
    - Min connections: 5
    - Idle timeout: 30 seconds
    - Connection timeout: 2 seconds
  - Logging enabled in development mode
  - Synchronize disabled for safety (migrations-only approach)

### 2. Test Database Configuration
- **Location**: `apps/api/src/config/test-data-source.ts`
- **Features**:
  - Separate test database (`protecht_bim_test`)
  - Schema drops before each test run
  - Logging disabled for cleaner test output

### 3. Initial Migration
- **Location**: `apps/api/src/migrations/1704000000000-InitialUserAuthentication.ts`
- **Tables Created**:
  - `users` - User accounts with authentication
  - `user_groups` - User group management
  - `roles` - Role-based access control
  - `permissions` - Granular permissions
  - `user_group_members` - User-to-group relationships
  - `user_roles` - User-to-role assignments
  - `role_permissions` - Role-to-permission mappings

- **Default Data**:
  - 4 system roles: Admin, Project Manager, Team Member, Viewer
  - 13 default permissions for projects, work packages, users, and roles
  - Pre-configured permission assignments for each role

### 4. Docker Compose Configuration
- **Location**: `docker-compose.yml`
- **Services**:
  - PostgreSQL 15 (Alpine) on port 5432
  - Redis 7 (Alpine) on port 6379
  - MinIO (S3-compatible storage) on ports 9000/9001
  - RabbitMQ 3 with management UI on ports 5672/15672
- **Features**:
  - Health checks for all services
  - Persistent volumes for data
  - Proper networking between services

### 5. Database Setup Script
- **Location**: `apps/api/scripts/setup-db.ts`
- **Features**:
  - Automated database initialization
  - Migration execution
  - Connection verification
  - Detailed logging

### 6. NPM Scripts
- **Location**: `apps/api/package.json`
- **Available Commands**:
  ```bash
  npm run migration:generate  # Generate new migration
  npm run migration:run       # Run pending migrations
  npm run migration:revert    # Revert last migration
  npm run db:setup           # Initialize database and run migrations
  ```

## 📋 Verification Steps

To verify the setup is working correctly:

### 1. Start Docker Services
```bash
docker-compose up -d
```

### 2. Wait for Services to be Healthy
```bash
docker-compose ps
```
All services should show "healthy" status.

### 3. Run Database Setup
```bash
cd apps/api
npm run db:setup
```

Expected output:
```
🔧 Setting up database...
📡 Connecting to database...
✅ Database connection established
🔄 Running migrations...
✅ Successfully ran 1 migration(s):
   - InitialUserAuthentication1704000000000
✨ Database setup complete!
```

### 4. Verify Database Tables
Connect to PostgreSQL and verify tables exist:
```bash
docker exec -it protecht-bim-postgres psql -U postgres -d protecht_bim
```

Then run:
```sql
\dt  -- List all tables
SELECT * FROM roles;  -- Should show 4 default roles
SELECT * FROM permissions;  -- Should show 13 default permissions
```

### 5. Test Connection from Application
```bash
npm run dev
```

The application should start and connect to the database successfully.

## 🔧 Configuration

### Environment Variables
All database configuration is in `apps/api/.env`:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=protecht_bim
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
```

### Connection Pool Settings
Configured in `data-source.ts`:
- **Max connections**: 20 (suitable for development and small production)
- **Min connections**: 5 (keeps connections warm)
- **Idle timeout**: 30 seconds (closes unused connections)
- **Connection timeout**: 2 seconds (fails fast on connection issues)

## 📊 Database Schema

### Users and Authentication Tables
```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── name (VARCHAR)
├── password_hash (VARCHAR)
├── status (VARCHAR) - active, inactive, suspended
├── language (VARCHAR)
├── timezone (VARCHAR)
├── hourly_rate (DECIMAL)
├── currency (VARCHAR)
├── avatar_url (VARCHAR)
├── is_placeholder (BOOLEAN)
├── last_login_at (TIMESTAMP)
├── preferences (JSONB)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

user_groups
├── id (UUID, PK)
├── name (VARCHAR)
├── description (TEXT)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

roles
├── id (UUID, PK)
├── name (VARCHAR, UNIQUE)
├── description (TEXT)
├── is_system (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

permissions
├── id (UUID, PK)
├── name (VARCHAR, UNIQUE)
├── resource (VARCHAR)
├── action (VARCHAR)
├── description (TEXT)
└── created_at (TIMESTAMP)
```

### Junction Tables
- `user_group_members` - Links users to groups
- `user_roles` - Links users to roles
- `role_permissions` - Links roles to permissions

## 🎯 Requirements Satisfied

✅ **Requirement 20.4**: PostgreSQL as primary database
✅ **Connection pooling**: Configured with appropriate limits
✅ **Development database**: `protecht_bim` database configured
✅ **Test database**: `protecht_bim_test` database configured
✅ **Migrations**: TypeORM migrations set up with initial schema
✅ **User authentication tables**: Complete schema for users, roles, permissions

## 🚀 Next Steps

The database setup is complete and ready for use. Next tasks in the implementation plan:

1. **Task 1.3**: Set up Redis for caching and sessions
2. **Task 2.x**: Implement authentication services and APIs
3. **Task 3.x**: Implement project hierarchy management
4. **Task 4.x**: Implement work package functionality

## 📝 Notes

- **Production Considerations**: For production deployment, consider:
  - Using managed PostgreSQL service (AWS RDS, Azure Database, etc.)
  - Implementing read replicas for scalability (Requirement 20.4)
  - Increasing connection pool size based on load
  - Enabling SSL/TLS for database connections
  - Setting up automated backups
  - Implementing connection retry logic with exponential backoff

- **Migration Best Practices**:
  - Always test migrations on a copy of production data
  - Keep migrations small and focused
  - Never modify existing migrations after they've been deployed
  - Use descriptive names for migrations
  - Include both `up` and `down` methods for rollback capability
