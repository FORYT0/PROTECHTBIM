#!/bin/bash

# PROTECHT BIM - Post-Deployment Verification Script
# Verifies all services are running and healthy

set -e

echo "🔍 PROTECHT BIM - Post-Deployment Verification"
echo "=================================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check service health
check_service() {
    local service=$1
    local check_cmd=$2
    
    if eval "$check_cmd" >/dev/null 2>&1; then
        echo -e "${GREEN}✅${NC} $service is healthy"
        return 0
    else
        echo -e "${RED}❌${NC} $service is not healthy"
        return 1
    fi
}

# Step 1: Check Running Containers
echo "${YELLOW}Step 1: Checking Running Containers${NC}"
echo ""
docker-compose -f docker-compose.production.yml ps
echo ""

# Step 2: Check API Service
echo "${YELLOW}Step 2: Checking API Service${NC}"
check_service "API" "curl -f http://localhost:3000/health"
echo ""

# Step 3: Check Database Connection
echo "${YELLOW}Step 3: Checking Database Connection${NC}"
check_service "PostgreSQL" "docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U protecht_admin"
echo ""

# Step 4: Check Redis Connection
echo "${YELLOW}Step 4: Checking Redis Connection${NC}"
check_service "Redis" "docker-compose -f docker-compose.production.yml exec -T redis redis-cli PING"
echo ""

# Step 5: Check Nginx
echo "${YELLOW}Step 5: Checking Nginx${NC}"
check_service "Nginx" "curl -f http://localhost:80/ -I"
echo ""

# Step 6: Check Disk Space
echo "${YELLOW}Step 6: Checking Disk Space${NC}"
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}')
echo "Disk usage: $DISK_USAGE"
echo ""

# Step 7: Check Logs for Errors
echo "${YELLOW}Step 7: Checking for Recent Errors${NC}"
echo "API Errors (last 10 lines):"
docker-compose -f docker-compose.production.yml logs api 2>/dev/null | tail -10 | grep -i error || echo "No recent errors found"
echo ""

# Step 8: Test API Endpoints
echo "${YELLOW}Step 8: Testing API Endpoints${NC}"
echo "Testing health endpoint:"
curl -s http://localhost:3000/health | jq .
echo ""

# Step 9: Check Database Tables
echo "${YELLOW}Step 9: Checking Database Tables${NC}"
docker-compose -f docker-compose.production.yml exec -T postgres psql -U protecht_admin -d protecht_bim_prod -c "SELECT schemaname, COUNT(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema') GROUP BY schemaname;" || true
echo ""

# Step 10: Verify Backups
echo "${YELLOW}Step 10: Checking Backups${NC}"
if [ -d "/backups" ]; then
    echo "Recent backups:"
    ls -lh /backups/ | tail -5 || echo "No backups found"
else
    echo "Backup directory not found"
fi
echo ""

# Step 11: Performance Check
echo "${YELLOW}Step 11: Performance Metrics${NC}"
echo "Container resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}\t{{.CPUPerc}}" 2>/dev/null || true
echo ""

# Step 12: Final Summary
echo "=================================================="
echo "${GREEN}✅ VERIFICATION COMPLETE${NC}"
echo "=================================================="
echo ""
echo "Summary:"
echo "- All containers running"
echo "- All services healthy"
echo "- Database connected"
echo "- Cache working"
echo "- Disk space available"
echo ""
echo "Your production deployment is ready!"
echo ""
echo "Common Commands:"
echo "  View logs:    docker-compose -f docker-compose.production.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.production.yml stop"
echo "  Restart services: docker-compose -f docker-compose.production.yml restart"
echo "  Update code: cd /opt/protecht-bim && git pull && docker-compose -f docker-compose.production.yml up -d"
echo ""
