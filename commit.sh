#!/bin/bash
# Run this: & "C:\Program Files\Git\bin\bash.exe" "C:\Users\User\AndroidStudioProjects\PROTECHT BIM\commit.sh"
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== REBUILD API BUNDLE ===" > "$LOG"
node apps/api/scripts/build-bundle.js 2>&1 | tail -4 >> "$LOG"

echo "" >> "$LOG"
echo "=== GIT COMMIT ===" >> "$LOG"
git add -A >> "$LOG" 2>&1
git status --short >> "$LOG" 2>&1
git commit -m "feat: Groq AI (ARIA) - full construction assistant integration

Backend:
- AIService.ts: Groq llama-3.3-70b-versatile with construction system prompt
  - chat(), evaluateRisk(), generateProjectInsights(), analyzeChangeOrder()
  - generateSnagDescription(), summarizeDailyReport()
- ai.routes.ts: 7 endpoints - /status /chat /risk-score /insights
  /analyze-change-order /generate-snag-description /summarize-report

Frontend:
- aiService.ts: Typed client using apiRequest() with auth
- AIBrain.tsx: Full chat panel with markdown, quick prompts,
  availability indicator, minimize/maximize, clear controls

GROQ_API_KEY must be set in Railway Variables to activate." >> "$LOG" 2>&1

git push origin main >> "$LOG" 2>&1
echo "DONE - check git_output.txt" >> "$LOG"
cat "$LOG"
