#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== REBUILD SEED ===" > "$LOG"
node apps/api/scripts/build-seed.js 2>&1 | tail -2 >> "$LOG"

echo "" >> "$LOG"
echo "=== RUN SEED ===" >> "$LOG"
export DATABASE_URL="postgresql://postgres:XjpUJrMWmSCihvHHJTXvxSaxpBdGCNfm@shortline.proxy.rlwy.net:35055/railway"
export NODE_ENV="production"
timeout 60 node apps/api/dist-bundle/seed.js >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMIT + PUSH ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git commit -m "seed: Add 120+ time entries for TimeTracking page demo data

Adds 30 working days x 3 users x 2 work packages = ~120 time entries
so TimeTrackingPage shows real logged hours instead of empty state.
Also adds TimeEntry import to seed-demo.ts." >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
