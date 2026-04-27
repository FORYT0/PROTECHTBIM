#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== REBUILD API BUNDLE ===" > "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -3 >> "$LOG"

echo "" >> "$LOG"
echo "=== COMMIT ALL CHANGES ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1

git commit -m "fix: Full A-grade audit — 23 issues resolved across all pages

CRITICAL FIXES:
- ActivityPage: rewrote to use useProjectContext (no more 'No Project' dead end)
- CalendarPage: real metrics from loaded WPs (not hardcoded 0), uses useProjectContext
- ResourceManagementPage: real metrics from utilization API, uniform typography
- ContractsPage: fixed import (useSearchParams was missing), edit modal wired correctly
  via initialData prop (contract prop didn't exist), edit button visible on hover
- ContractFormModal: edit mode now works — contractToFormData maps live data to form
- ProjectTimeCostPage: replaced axios+hardcoded URL with apiRequest() — fixes 401 in prod
- Layout.tsx: fixed mobile nav (wrong 4-element array pattern), unified nav items array,
  added Activity link, cleaned up code
- SnagsPage: status workflow buttons (Start Work → Mark Resolved → Verify & Close),
  edit button opens modal pre-filled with snag data
- ChangeOrdersPage: Submit/Approve/Reject buttons inline, rejection reason form inline,
  rejection reason displayed on rejected COs
- DailyReportsPage: edit button shows on hover, opens modal pre-filled, updateDailyReport
  API call (was write-only before)

NEW SERVICES:
- snagService: updateSnag, verifySnag, assignSnag, closeSnag, deleteSnag
- changeOrderService: submitChangeOrder, rejectChangeOrder (clean rewrite)
- dailyReportService: updateDailyReport added
- contractService: updateContract added, clean rewrite

NEW SHARED UTILITIES:
- utils/formatDate.ts: formatDate(), formatDateShort(), formatDateLong(), isOverdue(), daysFromNow()
- utils/formatCurrency.ts: formatKES(), formatUSD(), formatNumber()
- components/StateComponents.tsx: LoadingState, ErrorState, EmptyState — uniform UX

UNIFORMITY:
- All pages now use useProjectContext() consistently
- All pages use ProjectPicker for project selection
- All KPI cards now show real computed data (not hardcoded zeros)
- Mobile nav rebuilt with unified navItems array — no more duplicate/wrong 4-el entries
- Typography: ResourceManagementPage now matches system style (no ALL CAPS, font-black)
- All pages use space-y-5, min-w-0, pb-8 pattern
- Error/loading/empty states uniform across pages" >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== PUSH ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
