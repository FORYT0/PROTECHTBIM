.PHONY: help dev up down restart logs build clean migrate test db-reset

# Default target
help:
	@echo "PROTECHT BIM - Docker Development Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  dev         - Start all services in development mode"
	@echo "  up          - Start all services in detached mode"
	@echo "  down        - Stop all services"
	@echo "  restart     - Restart all services"
	@echo "  logs        - View logs from all services"
	@echo "  logs-api    - View logs from API service only"
	@echo "  build       - Build all Docker images"
	@echo "  clean       - Stop services and remove volumes (WARNING: deletes data)"
	@echo "  migrate     - Run database migrations"
	@echo "  test        - Run tests in API container"
	@echo "  db-reset    - Reset database (WARNING: deletes all data)"
	@echo "  shell-api   - Open shell in API container"
	@echo "  shell-db    - Open PostgreSQL shell"
	@echo "  ps          - Show running containers"
	@echo "  prod-up     - Start services in production mode"
	@echo "  prod-down   - Stop production services"

# Development mode (with logs)
dev:
	docker-compose up

# Start services in detached mode
up:
	docker-compose up -d
	@echo "Services started. Run 'make logs' to view logs."

# Stop services
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View API logs only
logs-api:
	docker-compose logs -f api

# Build images
build:
	docker-compose build

# Clean everything (including volumes)
clean:
	@echo "WARNING: This will delete all data in volumes!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		echo "All services stopped and volumes removed."; \
	fi

# Run database migrations
migrate:
	docker-compose exec api npm run migration:run --workspace=@protecht-bim/api

# Run tests
test:
	docker-compose exec api npm run test --workspace=@protecht-bim/api

# Reset database
db-reset:
	@echo "WARNING: This will delete all database data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v postgres; \
		docker-compose up -d postgres; \
		sleep 5; \
		docker-compose exec api npm run migration:run --workspace=@protecht-bim/api; \
		echo "Database reset complete."; \
	fi

# Open shell in API container
shell-api:
	docker-compose exec api sh

# Open PostgreSQL shell
shell-db:
	docker-compose exec postgres psql -U postgres -d protecht_bim

# Show running containers
ps:
	docker-compose ps

# Production commands
prod-up:
	docker-compose -f docker-compose.prod.yml up -d
	@echo "Production services started."

prod-down:
	docker-compose -f docker-compose.prod.yml down

prod-logs:
	docker-compose -f docker-compose.prod.yml logs -f

prod-build:
	docker-compose -f docker-compose.prod.yml build
