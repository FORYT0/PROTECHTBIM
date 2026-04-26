#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== FIXING CONTRACT SERVICE ===" > "$LOG"
C:/Python314/python.exe fix_contracts_service.py >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== REBUILDING BUNDLE ===" >> "$LOG"
node apps/api/scripts/build-bundle.js >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMITTING ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git commit -m "fix: ContractService.getContractsByProjectId was hardcoded to return []

Critical bug: getContractsByProjectId had a debug stub that always returned
an empty array regardless of the project. This caused the Contracts page
to always show 0 contracts even with valid data in the DB.

Also removed heavy TypeORM relations from ContractService list methods
(getAllContracts, getContractById, getContractByProjectId) which were
causing the same 15min timeout as the Snag/DailyReport services.

All 4 services now fixed: Snag, DailyReport, ChangeOrder, Contract." >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== PUSHING ===" >> "$LOG"
git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
