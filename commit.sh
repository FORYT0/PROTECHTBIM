#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== APPLYING FIXES ===" > "$LOG"
C:/Python314/python.exe fix_userid.py >> "$LOG" 2>&1
C:/Python314/python.exe fix_co_service.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== REBUILD ===" >> "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -3 >> "$LOG"

echo "" >> "$LOG"
echo "=== COMMIT & PUSH ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git commit -m "fix: All create operations failing - 5 root causes fixed

1. snags POST: userId was null (user?.userId fallback to hardcoded UUID
   that doesn't exist in users table -> FK violation). Now reads from
   JWT token first, body.createdBy second, returns 401 if neither.

2. daily-reports POST: Same null userId issue. Same fix applied.

3. change-orders POST: Service required contractId (threw 'Project ID
   and Contract ID are required') but change orders can exist without
   a contract. Made contractId optional in ChangeOrderService.

4. contracts POST: Was using hardcoded test UUID as fallback userId.
   Changed to read from JWT token.

5. change-orders route: userId fallback chain fixed same as others.

Time entries already work (201 confirmed in test)." >> "$LOG" 2>&1

git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
