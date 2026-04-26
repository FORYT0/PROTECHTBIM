#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== AUTH ROUTE FIX ===" > "$LOG"
C:/Python314/python.exe fix_auth_routes.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== REBUILD ===" >> "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -3 >> "$LOG"

echo "" >> "$LOG"
echo "=== COMMIT & PUSH ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git commit -m "fix: Add optionalAuth middleware to all POST create routes

The create endpoints (snags, daily-reports, change-orders, contracts)
were completely unauthenticated - req.user was always undefined.
The userId fallback to req.body.createdBy also failed because the
frontend (apiRequest) sends the JWT in the Authorization header but
doesn't include userId in the request body.

Fix: Added optionalAuth middleware that extracts userId from the JWT
Bearer token if present, without blocking if missing. This means:
- Authenticated requests: userId = req.user.userId from JWT
- Unauthenticated requests: return 401 (our existing check)

All 4 routes fixed: snags, daily-reports, change-orders, contracts" >> "$LOG" 2>&1
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
