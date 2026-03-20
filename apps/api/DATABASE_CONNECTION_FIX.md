# Database Connection Issue Fix

## Error
```
GET http://localhost:3000/api/v1/work_packages?page=1&per_page=20&sort_by=created_at&sort_order=desc 400 (Bad Request)
Error: Cannot read properties of undefined (reading 'databaseName')
```

## Root Cause
The `AppDataSource` is being accessed before it's properly initialized. This happens when:
1. The API server starts but database initialization fails
2. The repositories try to use `AppDataSource.getRepository()` before connection is established
3. TypeORM tries to access database properties that don't exist yet

## Solution Steps

### Step 1: Verify Database is Running

Check if PostgreSQL is running:

**Windows:**
```bash
# Check if PostgreSQL service is running
sc query postgresql-x64-14  # or your PostgreSQL version

# Or check if port 5432 is listening
netstat -an | findstr :5432
```

**Linux/Mac:**
```bash
# Check if PostgreSQL is running
ps aux | grep postgres

# Or check if port 5432 is listening
lsof -i :5432
```

### Step 2: Verify Database Exists

Connect to PostgreSQL and check if the database exists:

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# List databases
\l

# Check if protecht_bim exists
# If not, create it:
CREATE DATABASE protecht_bim;

# Exit
\q
```

### Step 3: Check Environment Variables

Verify your `.env` file in `apps/api/` has correct database settings:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=protecht_bim
```

### Step 4: Run Database Migrations

The database needs tables to be created:

```bash
cd apps/api

# Run migrations
npm run migration:run

# Or if using TypeORM CLI directly
npx typeorm migration:run -d src/config/data-source.ts
```

### Step 5: Restart API Server

After ensuring database is running and migrations are complete:

```bash
cd apps/api

# Stop the current server (Ctrl+C)

# Start fresh
npm run dev
```

### Step 6: Verify Connection

Check the API server logs for:

```
✅ Database connection established successfully
📊 Connected to: protecht_bim@localhost:5432
🚀 Server is running on http://localhost:3000
```

If you see these messages, the database is connected properly.

## Common Issues and Solutions

### Issue 1: PostgreSQL Not Running

**Symptoms:**
- Connection timeout errors
- "ECONNREFUSED" errors

**Solution:**
```bash
# Windows - Start PostgreSQL service
net start postgresql-x64-14

# Linux
sudo systemctl start postgresql

# Mac
brew services start postgresql
```

### Issue 2: Wrong Database Credentials

**Symptoms:**
- "password authentication failed"
- "role does not exist"

**Solution:**
- Check `.env` file has correct username/password
- Verify user exists in PostgreSQL
- Reset password if needed:
  ```sql
  ALTER USER postgres WITH PASSWORD 'postgres';
  ```

### Issue 3: Database Doesn't Exist

**Symptoms:**
- "database does not exist"

**Solution:**
```sql
CREATE DATABASE protecht_bim;
```

### Issue 4: Tables Don't Exist

**Symptoms:**
- "relation does not exist"
- Queries fail even though database exists

**Solution:**
```bash
cd apps/api
npm run migration:run
```

### Issue 5: Port Already in Use

**Symptoms:**
- "Port 3000 is already in use"

**Solution:**
```bash
# Find process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

## Quick Start Script

Create a script to automate the setup:

**setup-db.sh** (Linux/Mac):
```bash
#!/bin/bash

echo "🔍 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432; then
    echo "❌ PostgreSQL is not running"
    echo "Start it with: brew services start postgresql (Mac) or sudo systemctl start postgresql (Linux)"
    exit 1
fi

echo "✅ PostgreSQL is running"

echo "📊 Creating database if it doesn't exist..."
psql -U postgres -h localhost -tc "SELECT 1 FROM pg_database WHERE datname = 'protecht_bim'" | grep -q 1 || psql -U postgres -h localhost -c "CREATE DATABASE protecht_bim"

echo "🔄 Running migrations..."
cd apps/api
npm run migration:run

echo "✅ Database setup complete!"
echo "🚀 Start the API server with: npm run dev"
```

**setup-db.bat** (Windows):
```batch
@echo off

echo Checking PostgreSQL...
sc query postgresql-x64-14 | find "RUNNING" >nul
if errorlevel 1 (
    echo PostgreSQL is not running
    echo Start it with: net start postgresql-x64-14
    exit /b 1
)

echo PostgreSQL is running

echo Creating database if it doesn't exist...
psql -U postgres -h localhost -c "CREATE DATABASE IF NOT EXISTS protecht_bim"

echo Running migrations...
cd apps\api
call npm run migration:run

echo Database setup complete!
echo Start the API server with: npm run dev
```

## Verification Checklist

- [ ] PostgreSQL service is running
- [ ] Database `protecht_bim` exists
- [ ] `.env` file has correct credentials
- [ ] Migrations have been run successfully
- [ ] API server starts without errors
- [ ] API server logs show "Database connection established successfully"
- [ ] Health check endpoint works: `curl http://localhost:3000/health`
- [ ] Can create projects via API
- [ ] Can create work packages via API

## Testing the Fix

1. **Test Health Endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok",...}`

2. **Test API Version:**
   ```bash
   curl http://localhost:3000/api/v1
   ```
   Should return API information

3. **Test Authentication:**
   ```bash
   # Register a user
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
   ```

4. **Test Work Packages:**
   After logging in and getting a token, try listing work packages:
   ```bash
   curl http://localhost:3000/api/v1/work_packages \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Next Steps

Once the database is connected:

1. The work package creation should work
2. The calendar page should load work packages
3. All CRUD operations should function properly

If issues persist after following these steps, check:
- API server console for detailed error messages
- PostgreSQL logs for connection issues
- Network connectivity between API and database
