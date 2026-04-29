#!/bin/bash
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== COMMIT MIGRATION ===" > git_output.txt
git add -A >> git_output.txt 2>&1
git status --short >> git_output.txt 2>&1
git commit -m "feat: Migration from Railway to Render + Neon (free open-source stack)

Railway trial ended. Full migration to free infrastructure:

DEPLOY.md (NEW):
  Complete step-by-step migration guide:
  1. Neon.tech — free serverless Postgres (0.5GB, no card)
  2. Render.com — free Node web service (750hrs/month)
  3. Vercel env var update (VITE_API_URL → Render URL)
  4. Seed database via Render Shell or local CLI
  Also covers UptimeRobot keep-warm trick for Render free tier.

render.yaml (NEW):
  Render deployment config matching railway.toml:
  - Build: npm install + build-bundle.js
  - Start: node apps/api/dist-bundle/main.js
  - Health check: /health
  - All required env vars listed (DATABASE_URL, JWT_SECRET, etc.)

.env.example (UPDATED):
  Cleaned up, documents all required vars with comments.
  DATABASE_URL takes priority over individual DB_ vars.
  Notes on generating JWT_SECRET securely.

apps/web/src/utils/api.ts (UPDATED):
  - warmApi(): fires silent GET /health on app load so cold-start
    happens before the user clicks anything
  - Cold-start detection: shows 'API waking up' toast after 5s
  - Timeout raised 30s → 60s for Render free-tier cold-starts
  - Fires window Event 'api:warm' to dismiss toast on success

apps/web/src/main.tsx (UPDATED):
  - Calls warmApi() on mount (fire-and-forget health ping)
  - Listens for 'api:cold-start' event → shows loading toast
  - Listens for 'api:warm' event → dismisses toast + success msg

data-source.ts already supports DATABASE_URL — no backend changes needed." >> git_output.txt 2>&1
git push origin main >> git_output.txt 2>&1
echo "DONE" >> git_output.txt
cat git_output.txt
