#!/bin/bash
# Test every 30s until new bundle is deployed (snags stop timing out)
LOG="C:/Users/User/AndroidStudioProjects/PROTECHT BIM/git_output.txt"
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"
for i in $(seq 1 10); do
  echo "=== Attempt $i/10 ===" > "$LOG"
  result=$(C:/Python314/python.exe -c "
import urllib.request, json, ssl, time
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
base = 'https://protechtbim-production.up.railway.app'

# Quick login
req = urllib.request.Request(f'{base}/api/v1/auth/login',
  data=json.dumps({'email':'admin@protecht.demo','password':'Demo1234!'}).encode(),
  headers={'Content-Type':'application/json'}, method='POST')
r = urllib.request.urlopen(req, timeout=10, context=ctx)
token = json.loads(r.read())['tokens']['accessToken']

# Test snags with short timeout
try:
  req2 = urllib.request.Request(f'{base}/api/v1/snags/project/fdd1ff34-5d62-4116-8dcb-399f4ce1dae2')
  req2.add_header('Authorization', f'Bearer {token}')
  r2 = urllib.request.urlopen(req2, timeout=5, context=ctx)
  data = json.loads(r2.read())
  print(f'SNAGS_OK:{len(data.get(\"snags\",[]))}')
except Exception as e:
  print(f'SNAGS_FAIL:{str(e)[:30]}')
" 2>&1)
  echo "$result" >> "$LOG"
  echo "$(date): $result" >> "$LOG"
  cat "$LOG"
  if echo "$result" | grep -q "SNAGS_OK"; then
    break
  fi
  sleep 30
done
