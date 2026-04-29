#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== HEALTH CARD FIX ===" > "$LOG"
C:/Python314/python.exe fix_health_card.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== RE-RUN SEED (populate time entries) ===" >> "$LOG"
export DATABASE_URL="postgresql://postgres:XjpUJrMWmSCihvHHJTXvxSaxpBdGCNfm@shortline.proxy.rlwy.net:35055/railway"
export NODE_ENV="production"
node apps/api/dist-bundle/seed.js >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMIT ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1
git commit -m "feat: ProjectHealthCard integrated in ProjectDetailPage

- Added ProjectHealthCard component to Project Detail page
- Shows below the executive header section
- Props: progress, openSnags, criticalSnags, overdueWPs, totalWPs,
  pendingCOs, daysRemaining, totalDays
- All values from real API queries (realKPIs, realWPs, project dates)
- Days remaining computed live from project.end_date
- Total days computed from start → end date span" >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
