import urllib.request, json, ssl, sys
sys.stdout.reconfigure(encoding='utf-8')
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
r = urllib.request.urlopen("https://protechtbim-production.up.railway.app/health", timeout=15, context=ctx)
print(r.read().decode())
