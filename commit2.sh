#!/bin/bash
LOG2="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output2.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== REBUILD + COMMIT ===" > "$LOG2"
node apps/api/scripts/build-bundle.js 2>&1 | tail -2 >> "$LOG2"
git add apps/api/src/entities/ChangeOrder.ts >> "$LOG2" 2>&1
git commit -m "fix: ChangeOrder.contractId nullable in entity (direct file write)

Changed contractId from @Column('uuid') NOT NULL to:
  @Column({ type: 'uuid', nullable: true })
  contractId!: string | null;

Also changed ManyToOne to nullable: true and onDelete: 'SET NULL'.
TypeORM synchronize:true will auto-alter the column to allow NULL.
This allows creating change orders without a linked contract." >> "$LOG2" 2>&1
git push origin main >> "$LOG2" 2>&1
echo "DONE" >> "$LOG2"
cat "$LOG2"
