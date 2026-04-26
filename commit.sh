#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== GIT LOG ===" > "$LOG"
git log --oneline -5 >> "$LOG" 2>&1
echo "" >> "$LOG"

echo "=== HEALTH CHECK ===" >> "$LOG"
C:/Python314/python.exe -c "
import urllib.request, json, ssl, time
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

for attempt in range(1, 4):
    try:
        r = urllib.request.urlopen('https://protechtbim-production.up.railway.app/health', timeout=10, context=ctx)
        print(f'Attempt {attempt}: OK -', r.read().decode()[:120])
        break
    except Exception as e:
        print(f'Attempt {attempt}: FAIL -', str(e)[:60])
        if attempt < 3: time.sleep(5)
" >> "$LOG" 2>&1

cat "$LOG"
