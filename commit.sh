#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== STAGE ===" > "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1

echo "" >> "$LOG"
echo "=== COMMIT ===" >> "$LOG"
git commit -m "feat: ProjectHealthCard — multi-factor RAG health scoring component

components/ProjectHealthCard.tsx (NEW):
- Animated SVG progress ring showing overall score (0–100)
- 5 scored factors: Schedule, Quality, Progress, Contract, Timeline
- Each factor: progress bar + label + detail text + colour status
- Score computation logic:
  - Schedule: penalises overdue WPs (−200% per overdue WP share)
  - Quality: penalises critical snags (−25 each) + open snags (−8 each)
  - Progress: raw completion percentage
  - Contract: penalises pending COs (−15 each)
  - Timeline: compares actual vs expected progress (schedule variance)
- RAG thresholds: ≥70 = Healthy (green), ≥40 = At Risk (amber), <40 = Critical (red)
- Contextual description text updates based on overall RAG status
- Smooth CSS transitions on ring and bars" >> "$LOG" 2>&1

git push origin main >> "$LOG" 2>&1
echo "DONE" >> "$LOG"
cat "$LOG"
