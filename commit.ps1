$git = 'C:\Program Files\Git\cmd\git.exe'
$repo = 'C:\Users\User\AndroidStudioProjects\PROTECHT BIM'
$out = @()
$out += & $git -C $repo add apps/web/vite.config.ts apps/web/vitest.config.ts 2>&1
$out += & $git -C $repo add -A 2>&1
$out += & $git -C $repo commit -m "fix: import defineConfig from vite not vitest/config

vite.config.ts line 1 was: import { defineConfig } from 'vitest/config'
Vercel build failed with ERR_MODULE_NOT_FOUND for vitest package.
Fixed: import from 'vite' (always in dependencies)
Added: vitest.config.ts as separate file for test runs only" 2>&1
$out += & $git -C $repo push origin main 2>&1
$out | ForEach-Object { Write-Host $_ }
