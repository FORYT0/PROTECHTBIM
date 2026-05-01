#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/git_output.txt"
echo "=== STEP 1: START POSTGRES IN DOCKER ===" > "$LOG"

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "protecht-postgres"; then
  echo "Container exists — starting it..." >> "$LOG"
  docker start protecht-postgres >> "$LOG" 2>&1
else
  echo "Creating new postgres container..." >> "$LOG"
  docker run -d \
    --name protecht-postgres \
    --restart always \
    -e POSTGRES_USER=protecht \
    -e POSTGRES_PASSWORD=protecht2024 \
    -e POSTGRES_DB=protecht_bim \
    -p 5432:5432 \
    postgres:16-alpine >> "$LOG" 2>&1
fi

echo "" >> "$LOG"
echo "=== Waiting for Postgres to be ready... ===" >> "$LOG"
sleep 5

# Test connection
docker exec protecht-postgres pg_isready -U protecht >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== POSTGRES STATUS ===" >> "$LOG"
docker ps --filter name=protecht-postgres --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" >> "$LOG" 2>&1
cat "$LOG"
