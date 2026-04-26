#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== FIRST LINE OF Layout.tsx IN REPO ===" > "$LOG"
git show HEAD:apps/web/src/components/Layout.tsx | head -5 >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== FIRST LINE OF Layout.tsx ON DISK ===" >> "$LOG"
head -5 apps/web/src/components/Layout.tsx >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== FIRST LINE OF SnagsPage.tsx IN REPO ===" >> "$LOG"
git show HEAD:apps/web/src/pages/SnagsPage.tsx | head -5 >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== FIRST LINE OF SnagsPage.tsx ON DISK ===" >> "$LOG"
head -5 apps/web/src/pages/SnagsPage.tsx >> "$LOG" 2>&1
echo "" >> "$LOG"
echo "=== DIFF Layout.tsx ===" >> "$LOG"
git diff HEAD -- apps/web/src/components/Layout.tsx | head -20 >> "$LOG" 2>&1
cat "$LOG"
