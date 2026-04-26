#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== STATUS BEFORE ===" > "$LOG"
git status --short >> "$LOG" 2>&1
echo "=== ADD ALL ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
echo "=== STATUS AFTER ADD ===" >> "$LOG"
git status --short >> "$LOG" 2>&1
echo "=== COMMIT ===" >> "$LOG"
git commit -m "fix: responsiveness + project-scoped pages + overflow fixes

- html/body overflow-x:hidden prevents horizontal scroll
- InteractiveCard: min-w-0, truncate, no fixed min-width
- Layout: compact nav bar, overflow-safe, mobile-first
- useProjectContext hook: auto-picks first project if no project_id in URL
- ProjectPicker: dropdown component for in-page project switching
- SnagsPage: rewired with useProjectContext, responsive grid
- DailyReportsPage: rewired with useProjectContext, responsive grid
- ChangeOrdersPage: ProjectPicker added
- ContractsPage: ProjectPicker added" >> "$LOG" 2>&1
echo "=== PUSH ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
