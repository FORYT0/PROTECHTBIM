#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

# Poll health until uptime resets (indicating new deploy)
echo "=== WAITING FOR NEW DEPLOY (uptime reset) ===" > "$LOG"
for i in $(seq 1 15); do
    sleep 20
    uptime=$(C:/Python314/python.exe -c "
import urllib.request, json, ssl
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
try:
    r = urllib.request.urlopen('https://protechtbim-production.up.railway.app/health', timeout=8, context=ctx)
    d = json.loads(r.read())
    print(d.get('uptime',9999))
except: print(9999)
" 2>/dev/null)
    echo "  Attempt $i: uptime=${uptime}s" >> "$LOG"
    # If uptime < 120s, new container started
    if [ "$(echo "$uptime < 120" | C:/Python314/python.exe -c 'import sys; print("yes" if eval(sys.stdin.read()) else "no')" = "yes" ]; then
        echo "  NEW DEPLOY DETECTED!" >> "$LOG"
        break
    fi
done

sleep 30  # Let routes mount

echo "" >> "$LOG"
echo "=== CREATE TESTS (with auth) ===" >> "$LOG"
C:/Python314/python.exe test_create.py >> "$LOG" 2>&1
cat "$LOG"
