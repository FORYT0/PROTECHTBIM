@echo off
cd /d "C:\Users\User\AndroidStudioProjects\PROTECHT BIM"
git add apps/web/src/index.css
git add apps/web/src/main.tsx
git add apps/web/src/overflow-fix.css
git add apps/web/src/components/Layout.tsx
git add apps/web/src/components/InteractiveCard.tsx
git add apps/web/src/components/ProjectPicker.tsx
git add apps/web/src/hooks/useProjectContext.ts
git add apps/web/src/pages/SnagsPage.tsx
git add apps/web/src/pages/DailyReportsPage.tsx
git add apps/web/src/pages/ChangeOrdersPage.tsx
git add apps/web/src/pages/ContractsPage.tsx
git add -A
git status --short
git commit -m "fix: Responsiveness + project-scoped pages + no horizontal scroll

HORIZONTAL SCROLL FIX:
- index.css: Added overflow-x:hidden + max-width:100vw on html/body/#root
- overflow-fix.css: New file with global overflow protection
- InteractiveCard: Removed min-w hardcoding, added min-w-0 + overflow:hidden + truncate
- Layout: Replaced max-w-7xl padded container with proper overflow-x:hidden wrapper

LAYOUT IMPROVEMENTS:
- Layout.tsx: Complete rewrite - compact 14px height nav, smaller text, 
  scrollable horizontal pill strip (no wrapping), mobile menu max-height + scroll
  Nav links now include ?project_id= param so project-scoped pages auto-load data

PROJECT-SCOPED PAGES FIXED:
- NEW useProjectContext hook: auto-selects first project from API when no 
  project_id in URL, caches last used project in localStorage
- NEW ProjectPicker component: dropdown to switch projects within any page
- SnagsPage: full rewrite with ProjectPicker, auto-loads when project available
- DailyReportsPage: full rewrite with ProjectPicker, responsive grid layout
- ChangeOrdersPage: added ProjectPicker + useProjectContext, overflow fixes
- ContractsPage: added ProjectPicker + useProjectContext, overflow fixes

MOBILE FIXES:
- All card grids now use grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 (not fixed)
- Toolbars stack vertically on mobile (flex-col sm:flex-row)
- Text truncated with truncate class to prevent overflow
- No more min-w-[160px] on cards"
git push origin main
echo Done!
