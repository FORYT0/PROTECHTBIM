#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== FINAL FIXES ===" > "$LOG"
C:/Python314/python.exe fix_all_final.py >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== REBUILD BUNDLE ===" >> "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -3 >> "$LOG"
echo "" >> "$LOG"
echo "=== COMMIT ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1
git commit -m "fix: Final production-ready pass — localhost URLs, wrapper divs, mock data

Services (6 files):
  ActivityService, CommentService, CostEntryService, icalendarService,
  wikiService: localhost:3000 → import.meta.env.VITE_API_URL
  NotificationService: socket URL uses VITE_SOCKET_URL || stripped API URL

Pages (4 files):
  CostTrackingPage, TimeTrackingPage, WikiPageBoard, ProjectDetailPage:
  removed 'min-h-screen bg-[#000000]' outer wrapper — was causing
  double-background and overflow issues with the sidebar layout

ProjectDetailPage: remaining mockKPIs/mockFinancials replaced with
  realKPIs computed from live API data (snags, COs, WPs queries)

SprintDetailPage: localhost:3000 replaced with VITE env var" >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
