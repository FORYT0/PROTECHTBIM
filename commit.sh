#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== REBUILD BUNDLE ===" > "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -3 >> "$LOG"

echo "" >> "$LOG"
echo "=== STAGE ALL ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMIT ===" >> "$LOG"
git commit -m "feat: Premium SaaS features — Dashboard, Search, PDF Reports, Auth redesign

EXECUTIVE DASHBOARD (HomePage.tsx):
- Portfolio health score ring with RAG status (computed live)
- KPI grid: projects, overdue WPs, open snags, pending COs, CO value
- Active Projects list with per-row health dots
- Action Required alert panel with unread badge
- ARIA AI insight panel (context-aware construction advice)
- Dynamic greeting + hero gradient with decorative glow
- Quick Access module grid (6 major workflows)
- Demo project callout banner

CMD+K GLOBAL SEARCH (GlobalSearch.tsx):
- Opens anywhere with Ctrl+K / Cmd+K
- Real-time project search with 200ms debounce
- 8 pre-loaded quick nav shortcuts
- Arrow key navigation, Enter to select, Esc to dismiss
- Backdrop blur, keyboard hints footer
- Search button with ⌘K hint in desktop nav
- Full-width mobile search trigger

LAYOUT (Layout.tsx):
- GlobalSearch component integrated at root level
- Desktop nav: search button with shortcut badge
- Mobile nav: full-width search button above nav links

PDF REPORT GENERATOR (utils/reportGenerator.ts):
- generateProjectReportHTML(): branded A4 HTML with:
  - Dark gradient cover page (name, dates, status, progress)
  - Executive summary — 6 KPI cards with colour coding
  - Work packages table with inline SVG progress bars
  - Snag register with severity/status colour badges
  - Change orders table with cost impact (+/-) column
  - Recent site activity from daily reports
- downloadProjectReport(): saves .html file
- printProjectReport(): opens browser print → PDF

PROJECT DETAIL (ProjectDetailPage.tsx):
- 'Report' button in header actions — fetches all project data
  (snags, COs, daily reports, work packages) then generates report
- isGeneratingReport state with loading indicator
- Imports Download icon + reportGenerator + all data services

LOGIN PAGE (LoginPage.tsx — full redesign):
- Split layout: left brand panel + right form panel
- Left: gradient bg, grid overlay, feature list, social proof
- Right: clean email/password form, show/hide password
- 3 demo role buttons (click to prefill credentials)
- Password field with show/hide toggle

REGISTER PAGE (RegisterPage.tsx — full redesign):
- Matching split layout with left brand panel
- Password strength indicator (4-segment bar: Weak→Strong)
- Password match validation in real-time
- Matching button styles and form UX" >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== PUSH ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
