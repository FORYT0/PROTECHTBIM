Write-Host '========================================'
Write-Host 'Frontend Integration Tests'
Write-Host '========================================'
Write-Host ''

Write-Host '1. Web Server Status' -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8082' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host '   OK - Web server running on port 8082' -ForegroundColor Green
} catch {
    Write-Host '   FAIL - Web server not responding' -ForegroundColor Red
}

Write-Host ''
Write-Host '2. API Server Status' -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/health' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host '   OK - API server running' -ForegroundColor Green
} catch {
    Write-Host '   FAIL - API server not responding' -ForegroundColor Red
}

Write-Host ''
Write-Host '3. Service Files' -ForegroundColor Yellow
if (Test-Path 'apps/web/src/services/TimeEntryService.ts') {
    Write-Host '   OK - TimeEntryService exists' -ForegroundColor Green
}
if (Test-Path 'apps/web/src/services/CostEntryService.ts') {
    Write-Host '   OK - CostEntryService exists' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Web: http://localhost:8082'
Write-Host 'API: http://localhost:3000'
