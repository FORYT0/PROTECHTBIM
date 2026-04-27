#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== REBUILD API + SEED BUNDLES ===" > "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -3 >> "$LOG"
node apps/api/scripts/build-seed.js 2>&1 | tail -3 >> "$LOG"

echo "" >> "$LOG"
echo "=== RUN SEED (adds time entries) ===" >> "$LOG"
export DATABASE_URL="postgresql://postgres:XjpUJrMWmSCihvHHJTXvxSaxpBdGCNfm@shortline.proxy.rlwy.net:35055/railway"
export NODE_ENV="production"
node apps/api/dist-bundle/seed.js >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMIT ALL FIXES ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1
git commit -m "fix: Comprehensive A-grade audit — 20+ issues resolved

CRITICAL CRASHES FIXED:
- ActivityPage: no longer shows dead 'No Project Selected' — uses
  useProjectContext to auto-select project, works as standalone route
- CalendarPage: KPI metrics now computed from real loaded data (were 0)
- ResourceManagementPage: KPI metrics from API utilization data (were 0)
  Typography normalized to match system style (removed ALL CAPS/font-black)
- ProjectTimeCostPage: replaced axios+localhost with apiRequest() — fixes
  auth failure in production
- ContractsPage: fixed initialData vs contract prop mismatch on modal
  Edit flow now prefills correctly via contractToFormData()
- Layout.tsx: fixed mobile menu array index bug (was [href,activePath,label,icon])
  Activity link added to both desktop and mobile nav
- ContractsPage: removed useSearchParams (was not imported, caused crash)

FUNCTIONAL FIXES:
- WorkPackagesPage: GRID VIEW now actually renders card grid (was showing
  table regardless). Added List/Grid/Calendar 3-way view toggle.
  ProjectPicker added for project filtering
- SnagsPage: full status workflow buttons (Start Work → Mark Resolved →
  Verify & Close) + Edit button + edit modal pre-fill
- ChangeOrdersPage: Submit/Approve/Reject workflow with inline rejection
  reason form. Status transitions enforced per state machine
- DailyReportsPage: click row now opens edit modal (was navigating to
  non-existent /daily-reports/:id route)
- changeOrderService: added submitChangeOrder, rejectChangeOrder methods
- snagService: added updateSnag, verifySnag, assignSnag, closeSnag, deleteSnag
- contractService: added updateContract, simplified and cleaned up

SEED:
- seed-demo.ts: added 30 days × 3 users × 2 WPs = 120+ time entries
  so TimeTrackingPage shows real data instead of empty state

UI UNIFORMITY:
- All pages use consistent 2xl font-bold header (not mixed 3xl/4xl)
- All pages use ProjectPicker pattern (not custom project selectors)
- All pages: removed min-h-screen bg-black outer wrapper
- date formatting standardized to en-GB across pages
- Empty/loading/error states normalized across all pages" >> "$LOG" 2>&1

git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
