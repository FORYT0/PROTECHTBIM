#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== STATUS ===" > "$LOG"
git status --short >> "$LOG" 2>&1
echo "=== COMMIT ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git commit -m "fix: responsiveness overflow and project-scoped pages auto-load" >> "$LOG" 2>&1
echo "=== PUSH ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
