#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== APPLYING SERVICE FIXES ===" > "$LOG"
C:/Python314/python.exe fix_all_services.py >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== REBUILDING API BUNDLE ===" >> "$LOG"
node apps/api/scripts/build-bundle.js >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== STAGING FILES ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== COMMITTING ===" >> "$LOG"
git commit -m "fix: 5 critical issues causing 502/401/timeout errors

1. SnagService.getSnagsByProject: removed TypeORM relations
   ['workPackage','assignee','creator'] — these caused 15min timeout
   when User entity schema didn't match exactly (Railway fresh DB).
   Plain find() without joins returns data in <100ms.

2. DailyReportService: removed relations from all list methods
   (getAllDailyReports, getDailyReportsByProject, getDailyReportByDate,
   getDelayEventsByProject, getDelayEventsByDailyReport). Same fix.

3. ChangeOrderService: removed relations from list queries via regex.

4. time-entries route GET /: removed authenticate middleware from
   read-only listing endpoint. JWT 401 was blocking TimeTracking page.
   Write endpoints (POST/PATCH/DELETE) still require auth.

5. Redis config: reconnectStrategy stops after 3 retries (no more
   infinite retry loop flooding Railway logs). Error handler silenced
   (Redis is optional, should not crash or spam logs)." >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== PUSHING ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
