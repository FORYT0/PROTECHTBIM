Write-Host "=== Starting PROTECHT BIM Services ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "  OK Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "  FAIL Docker is not installed or not running!" -ForegroundColor Red
    Write-Host "  Please install Docker Desktop and start it" -ForegroundColor Yellow
    exit 1
}

# Check if Docker daemon is running
try {
    docker ps | Out-Null
    Write-Host "  OK Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "  FAIL Docker daemon is not running!" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Starting PostgreSQL and Redis..." -ForegroundColor Yellow
docker-compose up -d postgres redis

Write-Host ""
Write-Host "Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check PostgreSQL
Write-Host ""
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=protecht-bim-postgres" --filter "status=running" --format "{{.Names}}"
if ($postgresRunning) {
    Write-Host "  OK PostgreSQL is running" -ForegroundColor Green
    
    # Check if port is accessible
    $port = Get-NetTCPConnection -LocalPort 15432 -ErrorAction SilentlyContinue
    if ($port) {
        Write-Host "  OK Port 15432 is accessible" -ForegroundColor Green
    } else {
        Write-Host "  WARN Port 15432 is not accessible yet, waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "  FAIL PostgreSQL is not running" -ForegroundColor Red
    Write-Host "  Check logs with: docker logs protecht-bim-postgres" -ForegroundColor Yellow
}

# Check Redis
Write-Host ""
Write-Host "Checking Redis..." -ForegroundColor Yellow
$redisRunning = docker ps --filter "name=protecht-bim-redis" --filter "status=running" --format "{{.Names}}"
if ($redisRunning) {
    Write-Host "  OK Redis is running" -ForegroundColor Green
    
    # Check if port is accessible
    $port = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
    if ($port) {
        Write-Host "  OK Port 6379 is accessible" -ForegroundColor Green
    } else {
        Write-Host "  WARN Port 6379 is not accessible yet, waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
} else {
    Write-Host "  FAIL Redis is not running" -ForegroundColor Red
    Write-Host "  Check logs with: docker logs protecht-bim-redis" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Services Started ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start API server: cd apps/api; npm run dev" -ForegroundColor Gray
Write-Host "2. Start Web server: cd apps/web; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop services: docker-compose down" -ForegroundColor Gray
Write-Host "To view logs: docker-compose logs -f postgres redis" -ForegroundColor Gray
