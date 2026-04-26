@echo off
cd /d "C:\Users\User\AndroidStudioProjects\PROTECHT BIM"
git add apps/web/vite.config.ts apps/web/vitest.config.ts
git add -A
git status --short
git commit -m "fix: vite.config.ts imports from 'vite' not 'vitest/config' + split vitest config

Root cause of Vercel build failure:
  vite.config.ts line 1: import { defineConfig } from 'vitest/config'
  vitest is in devDependencies, Vercel's npm install in apps/web installs
  devDeps but vitest/config caused ERR_MODULE_NOT_FOUND in some cases.

Fix:
  vite.config.ts: changed import to 'vite' (always available, in dependencies)
  vitest.config.ts: new file that imports from 'vitest/config' for test runs only
  
This separation means:
  - vite build (Vercel) uses vite.config.ts -> no vitest dependency needed
  - vitest --run uses vitest.config.ts -> vitest available in devDeps"
git push origin main
