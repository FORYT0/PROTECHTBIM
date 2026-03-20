#!/bin/bash

# PROTECHT BIM Quick Start Script
# This script helps you get the development environment up and running quickly

set -e

echo "🚀 PROTECHT BIM Quick Start"
echo "============================"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "   You can edit .env to customize your configuration"
else
    echo "✅ .env file already exists"
fi
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."
echo "   This may take a few minutes on first run..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🏥 Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL is not ready yet, waiting..."
    sleep 5
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis is not ready yet, waiting..."
    sleep 5
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo "✅ MinIO is ready"
else
    echo "⚠️  MinIO is not ready yet, waiting..."
    sleep 5
fi

echo ""
echo "🗄️  Running database migrations..."
docker-compose exec -T api npm run migration:run --workspace=@protecht-bim/api || {
    echo "⚠️  Migrations failed or already applied"
}

echo ""
echo "✨ Setup complete!"
echo ""
echo "📍 Services are running at:"
echo "   • API:                http://localhost:3000"
echo "   • API Health Check:   http://localhost:3000/health"
echo "   • PostgreSQL:         localhost:5432"
echo "   • Redis:              localhost:6379"
echo "   • MinIO Console:      http://localhost:9001 (minioadmin/minioadmin)"
echo "   • RabbitMQ Mgmt:      http://localhost:15672 (guest/guest)"
echo ""
echo "📚 Useful commands:"
echo "   • View logs:          docker-compose logs -f"
echo "   • View API logs:      docker-compose logs -f api"
echo "   • Stop services:      docker-compose down"
echo "   • Restart services:   docker-compose restart"
echo "   • Run tests:          docker-compose exec api npm test"
echo ""
echo "📖 For more information, see DOCKER_SETUP.md"
echo ""
