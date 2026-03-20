# PROTECHT BIM Production API - Testing Guide

## Quick Start

The production API is running at: `http://localhost:3000`

## 1. Automated Test Script

Run the PowerShell test script:

```powershell
./test-api.ps1
```

This will test:
- Health check
- API info
- User registration/login
- Authentication
- Project creation
- Project listing

## 2. Manual Testing with curl/PowerShell

### Health Check
```powershell
curl -UseBasicParsing http://localhost:3000/health | ConvertFrom-Json
```

### API Info
```powershell
curl -UseBasicParsing http://localhost:3000/api/v1 | ConvertFrom-Json
```

### Register a User
```powershell
$body = @{
    email = "admin@protecht.com"
    password = "Admin123!@#"
    firstName = "Admin"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/register" -Method Post -Body $body -ContentType "application/json"
```

### Login
```powershell
$body = @{
    email = "admin@protecht.com"
    password = "Admin123!@#"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method Post -Body $body -ContentType "application/json"
$token = $response.token
```

### Get Current User
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/me" -Method Get -Headers $headers
```

### Create a Project
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
$body = @{
    name = "My First Project"
    description = "Test project"
    startDate = (Get-Date).ToString("yyyy-MM-dd")
    status = "active"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/v1/projects" -Method Post -Body $body -ContentType "application/json" -Headers $headers
```

### List Projects
```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/projects" -Method Get -Headers $headers
```

## 3. Using Postman or Insomnia

1. Import the OpenAPI spec from: `apps/api/openapi.yaml`
2. Set base URL to: `http://localhost:3000/api/v1`
3. For authenticated requests, add header: `Authorization: Bearer YOUR_TOKEN`

## 4. Check Container Status

### View all running containers
```powershell
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local ps
```

### View API logs
```powershell
docker logs protecht-bim-api-prod
```

### View API logs (follow)
```powershell
docker logs -f protecht-bim-api-prod
```

### View database logs
```powershell
docker logs protecht-bim-postgres-prod
```

## 5. Database Access

### Connect to PostgreSQL
```powershell
docker exec -it protecht-bim-postgres-prod psql -U postgres -d protecht_bim
```

### Common SQL queries
```sql
-- List all tables
\dt

-- Count users
SELECT COUNT(*) FROM "user";

-- List all projects
SELECT id, name, status FROM project;

-- Exit
\q
```

## 6. Available Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Projects
- `GET /api/v1/projects` - List projects
- `POST /api/v1/projects` - Create project
- `GET /api/v1/projects/:id` - Get project
- `PATCH /api/v1/projects/:id` - Update project
- `DELETE /api/v1/projects/:id` - Delete project

### Work Packages
- `GET /api/v1/work_packages` - List work packages
- `POST /api/v1/work_packages` - Create work package
- `GET /api/v1/work_packages/:id` - Get work package
- `PATCH /api/v1/work_packages/:id` - Update work package

### More endpoints
See the full API documentation at: http://localhost:3000/api/v1

## 7. Stop/Start Services

### Stop all services
```powershell
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local down
```

### Start all services
```powershell
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
```

### Restart API only
```powershell
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local restart api
```

### Rebuild and restart API
```powershell
docker build -f apps/api/Dockerfile.prod -t protechtbim-api:latest .
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d api
```

## 8. Troubleshooting

### API won't start
```powershell
# Check logs
docker logs protecht-bim-api-prod

# Check if database is ready
docker logs protecht-bim-postgres-prod

# Restart services
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local restart
```

### Database connection issues
```powershell
# Recreate with fresh data
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local down -v
docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d
```

### Module not found errors
The production build now properly handles TypeScript compilation and module resolution. If you see module errors:
1. Rebuild the image: `docker build -f apps/api/Dockerfile.prod -t protechtbim-api:latest .`
2. Restart: `docker-compose -f docker-compose.prod.yml --env-file .env.prod.local up -d`

## 9. Performance Testing

### Simple load test with curl
```powershell
1..100 | ForEach-Object {
    Measure-Command {
        curl -UseBasicParsing http://localhost:3000/health | Out-Null
    }
} | Measure-Object -Property TotalMilliseconds -Average
```

## Success Indicators

✅ Health check returns `{"status":"ok"}`
✅ API info returns name and version
✅ Can register/login users
✅ Can create and list projects
✅ All containers are healthy
✅ No errors in logs

## Next Steps

- Set up the web frontend (apps/web)
- Configure production environment variables
- Set up SSL/TLS certificates
- Configure backup strategies
- Set up monitoring and logging
