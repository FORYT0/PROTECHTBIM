#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== GIT STATUS ===" > "$LOG"
git status --short >> "$LOG" 2>&1

echo "=== GIT ADD ===" >> "$LOG"
git add -A >> "$LOG" 2>&1

echo "=== GIT STATUS AFTER ADD ===" >> "$LOG"
git status --short >> "$LOG" 2>&1

echo "=== GIT COMMIT ===" >> "$LOG"
git commit -m "fix: Route order bugs causing 404 on all project-scoped API endpoints

CRITICAL BUG FIXED (affected snags, daily-reports, change-orders):
Express routes /:id were registered BEFORE /project/:projectId, causing
Express to match /project/uuid as /:id='project' which returned 404.
All three route files had identical bug pattern. Fixed by moving
specific collection routes BEFORE the generic /:id route.

snags.routes.ts:
  - /project/:projectId moved BEFORE authenticateToken + /:id
  - /project/:projectId/metrics moved before /:id
  - /work-package/:workPackageId moved before /:id
  - Auth middleware now applied only to mutating/individual routes

daily-reports.routes.ts:
  - /project/:projectId moved BEFORE /:id
  - /project/:projectId/date/:date before /:id
  - /delay-events/project/:projectId before /:id
  - reportDate defaults to today if not provided

change-orders.routes.ts:
  - /project/:projectId moved BEFORE /:id
  - /project/:projectId/metrics moved before /:id
  - /contract/:contractId moved before /:id

useProjectContext.ts:
  - Added useRef(initialized) to prevent double-render that was canceling
    in-flight React Query requests (caused 'canceled' fetch in devtools)
  - staleTime increased to 10min (project list rarely changes)
  - refetchOnWindowFocus: false (no need to re-fetch on tab switch)
  - Validates cached projectId still exists in loaded projects list

API bundles rebuilt: 644KB main, 102KB seed" >> "$LOG" 2>&1

echo "=== GIT PUSH ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
