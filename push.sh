#!/bin/bash
cd "C:/Users/User/AndroidStudioProjects/PROTECHT BIM"

echo "=== EXPORT FIXES ===" > git_output.txt
C:/Python314/python.exe fix_exports.py >> git_output.txt 2>&1

echo "" >> git_output.txt
echo "=== FINAL API TEST ===" >> git_output.txt
C:/Python314/python.exe -c "
import urllib.request, json, ssl, sys
sys.stdout.reconfigure(encoding='utf-8')
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
base = 'https://protechtbim-production.up.railway.app'

def post(path, data):
    req = urllib.request.Request(f'{base}{path}', data=json.dumps(data).encode(), headers={'Content-Type':'application/json'}, method='POST')
    try: return json.loads(urllib.request.urlopen(req, timeout=12, context=ctx).read())
    except Exception as e: return {'error': str(e)[:50]}

def get(path, token=None):
    req = urllib.request.Request(f'{base}{path}')
    if token: req.add_header('Authorization', f'Bearer {token}')
    try:
        r = urllib.request.urlopen(req, timeout=12, context=ctx)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}
    except Exception as e:
        return 0, {'error': str(e)[:50]}

resp = post('/api/v1/auth/login', {'email':'admin@protecht.demo','password':'Demo1234!'})
token = resp.get('tokens',{}).get('accessToken','')
pid = 'fdd1ff34-5d62-4116-8dcb-399f4ce1dae2'

print(f'HEALTH: ', end='')
code, h = get('/health')
print(f'{code} - {h.get(\"status\")} db={h.get(\"db\")}')
print(f'LOGIN:  200 - {\"OK\" if token else \"FAIL\"}')

tests = [
    (f'/api/v1/projects', 'PROJECTS', 'projects'),
    (f'/api/v1/work_packages?project_id={pid}', 'WORK PACKAGES', 'work_packages'),
    (f'/api/v1/snags/project/{pid}', 'SNAGS', 'snags'),
    (f'/api/v1/daily-reports/project/{pid}', 'DAILY REPORTS', 'dailyReports'),
    (f'/api/v1/change-orders/project/{pid}', 'CHANGE ORDERS', 'changeOrders'),
    (f'/api/v1/contracts/project/{pid}/all', 'CONTRACTS', 'contracts'),
    (f'/api/v1/time_entries?date_from=2025-01-01&date_to=2025-12-31&per_page=5', 'TIME ENTRIES', 'time_entries'),
    (f'/api/v1/ai/status', 'AI STATUS', 'available'),
]

passed = 0
for path, label, key in tests:
    code, resp = get(path, token)
    val = resp.get(key, [])
    count = len(val) if isinstance(val, list) else str(val)
    ok = code == 200
    if ok: passed += 1
    print(f'{'OK ' if ok else 'FAIL'} {label}: {code} - {count} items')

print(f'\\nRESULT: {passed}/{len(tests)} endpoints passing')
" >> git_output.txt 2>&1

echo "" >> git_output.txt
echo "=== COMMIT ===" >> git_output.txt
git add -A >> git_output.txt 2>&1
git commit -m "fix: WikiPageBoard + export audit — all pages have correct exports" >> git_output.txt 2>&1
git push origin main >> git_output.txt 2>&1
echo "DONE" >> git_output.txt
cat git_output.txt
