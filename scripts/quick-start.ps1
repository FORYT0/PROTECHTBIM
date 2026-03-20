# PROTECHT BIM Quick Start Script (PowerShell)
# This script helps you get the development environment up and running quickly

$ErrorActionPreference = "Stop"

Write-Host "🚀 PROTECHT BIM Quick Start" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "   Visit: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker Compose is installed
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not installed." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ .env file created" -ForegroundColor Green
    Write-Host "   You can edit .env to customize your configuration" -ForegroundColor Gray
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""

# Start Docker services
Write-Host "🐳 Starting Docker services..." -ForegroundColor Cyan
Write-Host "   This may take a few minutes on first run..." -ForegroundColor Gray
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host ""
Write-Host "🏥 Checking service health..." -ForegroundColor Cyan

# Check PostgreSQL
try {
    docker-compose exec -T postgres pg_isready -U postgres | Out-Null
    Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  PostgreSQL is not ready yet, waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Check Redis
try {
    docker-compose exec -T redis redis-cli ping | Out-Null
    Write-Host "✅ Redis is ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Redis is not ready yet, waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# Check MinIO
try {
    $response = Invoke-WebRequest -Uri "http://localhost:9000/minio/health/live" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ MinIO is ready" -ForegroundColor Green
} catch {
    Write-Host "⚠️  MinIO is not ready yet, waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
try {
    docker-compose exec -T api npm run migration:run --workspace=@protecht-bim/api
} catch {
    Write-Host "⚠️  Migrations failed or already applied" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Services are running at:" -ForegroundColor Cyan
Write-Host "   • API:                http://localhost:3000" -ForegroundColor White
Write-Host "   • API Health Check:   http://localhost:3000/health" -ForegroundColor White
Write-Host "   • PostgreSQL:         localhost:5432" -ForegroundColor White
Write-Host "   • Redis:              localhost:6379" -ForegroundColor White
Write-Host "   • MinIO Console:      http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor White
Write-Host "   • RabbitMQ Mgmt:      http://localhost:15672 (guest/guest)" -ForegroundColor White
Write-Host ""
Write-Host "📚 Useful commands:" -ForegroundColor Cyan
Write-Host "   • View logs:          docker-compose logs -f" -ForegroundColor White
Write-Host "   • View API logs:      docker-compose logs -f api" -ForegroundColor White
Write-Host "   • Stop services:      docker-compose down" -ForegroundColor White
Write-Host "   • Restart services:   docker-compose restart" -ForegroundColor White
Write-Host "   • Run tests:          docker-compose exec api npm test" -ForegroundColor White
Write-Host ""
Write-Host "📖 For more information, see DOCKER_SETUP.md" -ForegroundColor Gray
Write-Host ""
