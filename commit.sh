#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== FIXING TIME ENTRIES ===" > "$LOG"
C:/Python314/python.exe fix_time_entries.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== REBUILDING BUNDLE ===" >> "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -4 >> "$LOG"

echo "" >> "$LOG"
echo "=== COMMITTING ALL ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git commit -m "fix: Time entries date format + TimeEntryService rewrite

Backend (time-entries.routes.ts):
  - date_from/date_to parsing now accepts YYYY-MM-DD without rejecting
    with 400. Splits on T so ISO dates also work. No longer throws on
    partial dates.

Frontend (TimeEntryService.ts):
  - Complete rewrite using apiRequest() instead of axios
  - Fixes auth: was reading localStorage 'auth_token' (singular) but
    we store as 'auth_tokens' (plural). apiRequest() handles auth correctly.
  - toDateStr() helper ensures all dates sent as YYYY-MM-DD
  - All methods now use consistent error handling" >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== PUSHING ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
