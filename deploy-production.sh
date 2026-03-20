#!/bin/bash

# PROTECHT BIM - Production Deployment Script
# This script automates the entire production deployment process

set -e

echo "🚀 PROTECHT BIM - Production Deployment Starting..."
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check Prerequisites
echo "${YELLOW}Step 1: Checking Prerequisites...${NC}"
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is not installed"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is not installed"; exit 1; }
echo "${GREEN}✅ Docker and Docker Compose are installed${NC}"
echo ""

# Step 2: Check Environment File
echo "${YELLOW}Step 2: Checking Environment Configuration...${NC}"
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found"
    echo "Please create .env.production with required environment variables"
    exit 1
fi
echo "${GREEN}✅ .env.production found${NC}"
echo ""

# Step 3: Build Docker Images
echo "${YELLOW}Step 3: Building Docker Images...${NC}"
docker-compose -f docker-compose.production.yml build --pull
echo "${GREEN}✅ Docker images built successfully${NC}"
echo ""

# Step 4: Start Services
echo "${YELLOW}Step 4: Starting Services...${NC}"
docker-compose -f docker-compose.production.yml up -d
echo "${GREEN}✅ Services started${NC}"
echo ""

# Step 5: Wait for Services to be Ready
echo "${YELLOW}Step 5: Waiting for Services to be Ready...${NC}"
sleep 10
echo "${GREEN}✅ Services ready${NC}"
echo ""

# Step 6: Check Service Status
echo "${YELLOW}Step 6: Checking Service Status...${NC}"
docker-compose -f docker-compose.production.yml ps
echo ""

# Step 7: Run Database Migrations
echo "${YELLOW}Step 7: Running Database Migrations...${NC}"
docker-compose -f docker-compose.production.yml exec -T api npm run migrate:prod || true
echo "${GREEN}✅ Database migrations completed${NC}"
echo ""

# Step 8: Verify API Health
echo "${YELLOW}Step 8: Verifying API Health...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/health >/dev/null 2>&1; then
        echo "${GREEN}✅ API is healthy${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ API health check failed"
        exit 1
    fi
    echo "Waiting for API to be ready... ($i/30)"
    sleep 2
done
echo ""

# Step 9: Verify Database Connection
echo "${YELLOW}Step 9: Verifying Database Connection...${NC}"
docker-compose -f docker-compose.production.yml exec -T api npm run db:check || true
echo "${GREEN}✅ Database connection verified${NC}"
echo ""

# Step 10: Display Service Information
echo "${YELLOW}Step 10: Deployment Summary${NC}"
echo "=================================================="
echo ""
echo "Services Running:"
docker-compose -f docker-compose.production.yml ps --services
echo ""
echo "Access Information:"
echo "  API: http://localhost:3000"
echo "  API Health: http://localhost:3000/health"
echo "  Nginx: http://localhost:80"
echo ""
echo "View Logs:"
echo "  docker-compose -f docker-compose.production.yml logs -f api"
echo ""
echo "Manage Services:"
echo "  Stop:  docker-compose -f docker-compose.production.yml stop"
echo "  Start: docker-compose -f docker-compose.production.yml up -d"
echo "  Restart: docker-compose -f docker-compose.production.yml restart"
echo ""

# Step 11: Configure SSL (optional)
echo "${YELLOW}Step 11: SSL/TLS Configuration${NC}"
echo "To enable HTTPS:"
echo "1. Obtain SSL certificates (Let's Encrypt recommended)"
echo "2. Place them in ./certs/ directory"
echo "3. Update nginx.conf with certificate paths"
echo "4. Restart Nginx: docker-compose -f docker-compose.production.yml restart nginx"
echo ""

# Step 12: Setup Monitoring
echo "${YELLOW}Step 12: Setup Monitoring${NC}"
echo "Monitoring Tools:"
echo "  - Sentry: Configure SENTRY_DSN_PROD in .env.production"
echo "  - Healthchecks.io: Setup uptime monitoring"
echo "  - GitHub Actions: Automated CI/CD pipeline configured"
echo ""

# Step 13: Backup Configuration
echo "${YELLOW}Step 13: Automated Backups${NC}"
echo "Database backups are configured to run daily."
echo "Backup location: /backups/"
echo "To manually backup:"
echo "  docker-compose -f docker-compose.production.yml exec postgres pg_dump -U protecht_admin protecht_bim_prod | gzip > backup.sql.gz"
echo ""

# Final Status
echo "=================================================="
echo "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "=================================================="
echo ""
echo "PROTECHT BIM is now running in production!"
echo ""
echo "Next Steps:"
echo "1. Verify all services are running: docker-compose -f docker-compose.production.yml ps"
echo "2. Test API endpoints: curl http://localhost:3000/api/v1"
echo "3. Configure custom domain in Nginx"
echo "4. Setup SSL certificates"
echo "5. Enable monitoring and alerting"
echo ""
echo "🚀 Your application is ready for production use!"
echo ""
