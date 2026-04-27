#!/bin/bash
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
echo "=== CHECKING TIME ENTRIES ===" > "$LOG"
C:/Python314/python.exe -c "
import urllib.request, json, ssl
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
base = 'https://protechtbim-production.up.railway.app'

req = urllib.request.Request(f'{base}/api/v1/auth/login',
    data=json.dumps({'email':'admin@protecht.demo','password':'Demo1234!'}).encode(),
    headers={'Content-Type':'application/json'}, method='POST')
token = json.loads(urllib.request.urlopen(req, timeout=10, context=ctx).read())['tokens']['accessToken']

req2 = urllib.request.Request(f'{base}/api/v1/time_entries?per_page=5&date_from=2025-01-01&date_to=2025-12-31')
req2.add_header('Authorization', f'Bearer {token}')
r = urllib.request.urlopen(req2, timeout=10, context=ctx)
data = json.loads(r.read())
print('TIME ENTRIES total:', data.get('total', 0))
if data.get('time_entries'):
    te = data['time_entries'][0]
    print('First:', te.get('hours'), 'h on', str(te.get('date',''))[:10])
" >> "$LOG" 2>&1
cat "$LOG"
