@echo off
REM PROTECHT BIM — Start API Server
REM Run this batch file to start the API after a reboot.
REM Place a shortcut in: shell:startup  (Win+R, paste that)
REM to auto-start on Windows login.

set "REPO=C:\Users\User\AndroidStudioProjects\PROTECHT BIM"
set "NODE=C:\Program Files\nodejs\node.exe"
set "LOG=C:\Users\User\AndroidStudioProjects\api_output.log"

REM Environment variables
set NODE_ENV=production
set PORT=3000
set DATABASE_URL=postgresql://protecht:protecht2024@127.0.0.1:5432/protecht_bim?sslmode=disable
set JWT_SECRET=abad0917c2679de3df407c269ca1d6fab95dbee8d30cf66a54b4247e4377ae9f
set GROQ_API_KEY=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
set CORS_ORIGIN=https://protechtbim-web.vercel.app,http://localhost:5173

echo Starting PROTECHT BIM API...
start "PROTECHT-BIM-API" /MIN "%NODE%" "%REPO%\apps\api\dist-bundle\main.js" > "%LOG%" 2>&1
echo API started. Log: %LOG%
echo.
echo Next: start Cloudflare Tunnel in a separate window:
echo   cloudflared tunnel --url http://localhost:3000
echo.
echo Then update VITE_API_URL on Vercel with the new tunnel URL.
