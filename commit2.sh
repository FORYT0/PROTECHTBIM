#!/bin/bash
LOG2="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output2.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== FIX CO ENTITY ===" > "$LOG2"
C:/Python314/python.exe fix_co_entity.py >> "$LOG2" 2>&1
node apps/api/scripts/build-bundle.js 2>&1 | tail -2 >> "$LOG2"
git add -A >> "$LOG2" 2>&1
git commit -m "fix: ChangeOrder.contractId made nullable in entity + DB schema

The contractId column was @Column('uuid') (NOT NULL) which prevented
creating change orders without a linked contract. Changed to nullable
so COs can be created independently of contracts.

TypeORM synchronize:true will auto-migrate the column to nullable." >> "$LOG2" 2>&1
git push origin main >> "$LOG2" 2>&1
echo "DONE" >> "$LOG2"
cat "$LOG2"
