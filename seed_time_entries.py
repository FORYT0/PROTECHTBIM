import urllib.request, json, ssl, sys
sys.stdout.reconfigure(encoding='utf-8')
ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
base = 'https://protechtbim-production.up.railway.app'

def post(path, data, token=None):
    req = urllib.request.Request(f'{base}{path}', data=json.dumps(data).encode(),
        headers={'Content-Type':'application/json'}, method='POST')
    if token: req.add_header('Authorization', f'Bearer {token}')
    try:
        r = urllib.request.urlopen(req, timeout=12, context=ctx)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode())
        except: return e.code, {}

def get(path, token):
    req = urllib.request.Request(f'{base}{path}')
    req.add_header('Authorization', f'Bearer {token}')
    try:
        r = urllib.request.urlopen(req, timeout=12, context=ctx)
        return r.status, json.loads(r.read())
    except: return 0, {}

# Login
_, resp = post('/api/v1/auth/login', {'email':'admin@protecht.demo','password':'Demo1234!'})
token = resp['tokens']['accessToken']
print('Login OK')

# Get work packages
_, wps = get('/api/v1/work_packages', token)
wp_ids = [w['id'] for w in wps.get('work_packages', [])[:4]]
print(f'Work packages: {len(wp_ids)}')

# Comments per work package type
comments = [
    'Concrete pour completed — 18 workers on site',
    'Rebar placement and inspection',
    'Formwork striking and curing',
    'MEP first-fix installation',
    'Quality control checks and documentation',
    'Supervisor inspection and sign-off',
]

# Create 40 time entries spread across last 3 weeks
from datetime import date, timedelta

created = 0
failed = 0
dates = [date(2025, 12, 1) + timedelta(days=i) for i in range(21) if (date(2025, 12, 1) + timedelta(days=i)).weekday() < 5]

for i, d in enumerate(dates[:15]):  # 15 working days
    for j, hours in enumerate([6, 4, 8, 5]):
        if j >= len(wp_ids): continue
        code, resp = post('/api/v1/time_entries', {
            'work_package_id': wp_ids[j % len(wp_ids)],
            'hours': hours,
            'date': d.isoformat(),
            'comment': comments[(i + j) % len(comments)],
            'billable': j % 3 != 0,
        }, token)
        if code in [200, 201]:
            created += 1
        else:
            failed += 1
            if failed <= 3: print(f'FAIL {code}: {resp}')

print(f'Created: {created} time entries, Failed: {failed}')
