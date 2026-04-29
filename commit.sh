#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== FIX APP LOADING SCREEN ===" > "$LOG"
C:/Python314/python.exe fix_app.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMIT ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1

git commit -m "feat: Polish pass — 404 page, PWA manifest, favicon, loading screen, SEO meta

NotFoundPage.tsx:
- Oversized '404' text with floating logo icon overlay
- 'Go Back' + 'Dashboard' action buttons
- Quick nav grid: 6 most-used pages as pill buttons

index.html:
- Full SEO meta tags (description, keywords, robots)
- Open Graph + Twitter Card meta for link previews
- PWA manifest + apple-mobile-web-app meta tags
- DNS prefetch for Railway API (faster first load)

public/manifest.json (NEW):
- PWA manifest: add to homescreen support
- 3 app shortcuts (Projects, Snags, Daily Reports)
- Standalone display mode
- Theme/background color: #000000

public/favicon.svg (NEW):
- Custom building icon SVG favicon
- Blue gradient background matching brand

App.tsx:
- Premium branded loading screen with:
  - Animated logo icon (pulse)
  - Progress bar animation
  - 'PROTECHT BIM / Loading...' text" >> "$LOG" 2>&1

git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
