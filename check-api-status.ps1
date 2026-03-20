# Check if API server is accessible
Write-Host "Checking API server status..." -ForegroundColor Cyan

# Check if port 8080 is listening
$port8080 = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue
if ($port8080) {
    Write-Host "✓ Port 8080 is in use" -ForegroundColor Green
} else {
    Write-Host "✗ Port 8080 is NOT in use - API server is not running!" -ForegroundColor Red
    Write-Host "  Start it with: cd apps/api; npm run dev" -ForegroundColor Yellow
    exit 1
}

# Try to access health endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ API server is responding" -ForegroundColor Green
    Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "✗ API server is not responding" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Check PostgreSQL (port 15432 from .env)
$portPostgres = Get-NetTCPConnection -LocalPort 15432 -ErrorAction SilentlyContinue
if ($portPostgres) {
    Write-Host "✓ PostgreSQL is running on port 15432" -ForegroundColor Green
} else {
    Write-Host "✗ PostgreSQL is NOT running on port 15432" -ForegroundColor Red
    Write-Host "  Start it with: docker-compose up -d postgres" -ForegroundColor Yellow
}

# Check Redis (port 6379)
$portRedis = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
if ($portRedis) {
    Write-Host "✓ Redis is running on port 6379" -ForegroundColor Green
} else {
    Write-Host "✗ Redis is NOT running on port 6379" -ForegroundColor Red
    Write-Host "  Start it with: docker-compose up -d redis" -ForegroundColor Yellow
}

Write-Host "`nAll checks complete!" -ForegroundColor Cyan
