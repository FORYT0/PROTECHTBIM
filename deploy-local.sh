#!/bin/bash

# PROTECHT BIM - Production Deployment Script
# Deploys API + PostgreSQL + Redis with Docker Compose

set -e

echo "=========================================="
echo "PROTECHT BIM - Production Deployment"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
echo "Checking Docker daemon..."
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check if image exists
echo ""
echo "Checking if API image exists..."
if docker image inspect protechtbim-api:v3 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API image found: protechtbim-api:v3${NC}"
else
    echo -e "${RED}✗ API image not found. Build may still be in progress.${NC}"
    echo "  Wait for: docker build -f Dockerfile.api-only -t protechtbim-api:v3 ."
    exit 1
fi

# Check existing containers
echo ""
echo "Checking for existing containers..."
if docker ps -a --format '{{.Names}}' | grep -E "protecht-.*-prod" > /dev/null; then
    echo "Found existing PROTECHT containers. Removing..."
    docker-compose -f docker-compose.production.yml down --remove-orphans
    sleep 2
fi

# Start all services
echo ""
echo "Starting services with docker-compose..."
docker-compose -f docker-compose.production.yml up -d

# Wait for health checks
echo ""
echo "Waiting for services to become healthy..."
sleep 5

# Check PostgreSQL
echo ""
echo "Checking PostgreSQL..."
if docker ps --format '{{.Names}}' | grep -q "protecht-postgres-prod"; then
    if docker-compose -f docker-compose.production.yml exec postgres pg_isready -U protecht_admin > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is healthy${NC}"
    else
        echo -e "${RED}✗ PostgreSQL is not responding${NC}"
        docker logs protecht-postgres-prod
        exit 1
    fi
fi

# Check Redis
echo ""
echo "Checking Redis..."
if docker ps --format '{{.Names}}' | grep -q "protecht-redis-prod"; then
    if docker exec protecht-redis-prod redis-cli -a redis_secure_password_2024 ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is healthy${NC}"
    else
        echo -e "${RED}✗ Redis is not responding${NC}"
        docker logs protecht-redis-prod
        exit 1
    fi
fi

# Wait for API to start
echo ""
echo "Waiting for API to start (up to 30 seconds)..."
ATTEMPTS=0
MAX_ATTEMPTS=30
while [ $ATTEMPTS -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is healthy and responding${NC}"
        break
    fi
    ATTEMPTS=$((ATTEMPTS + 1))
    sleep 1
done

if [ $ATTEMPTS -eq $MAX_ATTEMPTS ]; then
    echo -e "${YELLOW}⚠ API health check timeout${NC}"
    echo "Checking API logs..."
    docker logs protecht-api-prod
fi

# Display deployment summary
echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Services:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep protecht
echo ""
echo "Access Points:"
echo "  - API:        http://localhost:8080"
echo "  - Health:     http://localhost:8080/health"
echo "  - PostgreSQL: localhost:5432 (protecht_admin)"
echo "  - Redis:      localhost:6379"
echo ""
echo "Useful commands:"
echo "  docker-compose -f docker-compose.production.yml logs -f api"
echo "  docker-compose -f docker-compose.production.yml ps"
echo "  docker-compose -f docker-compose.production.yml down"
echo ""
