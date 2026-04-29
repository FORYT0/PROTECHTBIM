#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== FIXING PAGES ===" > "$LOG"
C:/Python314/python.exe fix_pages.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== GIT STATUS ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMIT & PUSH ===" >> "$LOG"
git commit -m "fix: CostTrackingPage default export + remove conflicting outer wrapper divs

- CostTrackingPage: was 'export const' (named) but App.tsx uses lazy
  default import. Added 'export default CostTrackingPage' so the page
  actually loads instead of rendering undefined.

- ProjectDetailPage, ActivityPage, CalendarPage, ResourceManagementPage:
  removed 'min-h-screen bg-[#000000]' outermost wrapper div.
  These were creating a full-viewport black div inside the layout's
  content area, causing double background, overflow issues, and
  misaligned padding with the sidebar layout." >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
