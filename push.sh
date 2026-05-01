#!/bin/bash
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
git add -A
git status --short
git commit -m "fix: Cloudflare Tunnel URL as API fallback for Vercel frontend" 2>/dev/null || echo "nothing new to commit"
git push origin main
echo "PUSHED"
