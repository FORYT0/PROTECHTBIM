#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== FIXING PROJECT DETAIL PAGE ===" > "$LOG"
C:/Python314/python.exe fix_project_detail2.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== REBUILD BUNDLE ===" >> "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -3 >> "$LOG"

echo "" >> "$LOG"
echo "=== COMMIT & PUSH ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1
git commit -m "fix: ProjectDetailPage — replace all hardcoded mockKPIs/mockFinancials with real API data

- Added useQuery hooks for snags, change orders, work packages on the project
- Computed realKPIs from live data:
  tasks.total/overdue from WPs, openSnags, criticalSnags,
  pendingCOs, totalCOValue, completedWPs, completion from project.progress
- ProgressRing now shows actual project progress %
- KPI cards show real counts instead of 128/14/6/8/12/34
- Financial indicators use dashboard query data
- Removed all mockKPIs, mockFinancials, mockBIM objects" >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
