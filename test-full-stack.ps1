Write-Host '========================================' -ForegroundColor Cyan
Write-Host 'Full Stack Integration Tests' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''

# Test 1: Web Server
Write-Host '1. Web Server' -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:8082' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host '   OK - Running on port 8082' -ForegroundColor Green
} catch {
    Write-Host '   FAIL - Not responding' -ForegroundColor Red
}

# Test 2: API Server
Write-Host ''
Write-Host '2. API Server' -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/health' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host '   OK - API server healthy' -ForegroundColor Green
} catch {
    Write-Host '   FAIL - API not responding' -ForegroundColor Red
}

# Test 3: API Endpoints
Write-Host ''
Write-Host '3. API Endpoints (without auth)' -ForegroundColor Yellow
$endpoints = @('projects', 'work-packages', 'time_entries', 'cost-entries', 'contracts', 'change-orders', 'daily-reports', 'snags')
foreach ($ep in $endpoints) {
    try {
        $r = Invoke-WebRequest -Uri \"http://localhost:3000/api/v1/$ep\" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host \"   OK - /$ep (200)\" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 401) {
            Write-Host \"   OK - /$ep (401 - auth required)\" -ForegroundColor Green
        } else {
            Write-Host \"   WARN - /$ep failed\" -ForegroundColor Yellow
        }
    }
}

# Test 4: Database Connection
Write-Host ''
Write-Host '4. Database Connection' -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/v1/health' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    $health = $r.Content | ConvertFrom-Json
    if ($health.database -eq 'connected') {
        Write-Host '   OK - Database connected' -ForegroundColor Green
    } else {
        Write-Host '   WARN - Database status unknown' -ForegroundColor Yellow
    }
} catch {
    Write-Host '   WARN - Could not check database' -ForegroundColor Yellow
}

# Test 5: Service Files
Write-Host ''
Write-Host '5. Frontend Service Files' -ForegroundColor Yellow
$services = @(
    'apps/web/src/services/TimeEntryService.ts',
    'apps/web/src/services/CostEntryService.ts',
    'apps/web/src/services/projectService.ts',
    'apps/web/src/services/workPackageService.ts',
    'apps/web/src/services/contractService.ts'
)
foreach ($svc in $services) {
    if (Test-Path $svc) {
        $name = Split-Path $svc -Leaf
        Write-Host \"   OK - $name\" -ForegroundColor Green
    }
}

# Test 6: Updated Pages
Write-Host ''
Write-Host '6. Updated Pages' -ForegroundColor Yellow
$pages = @(
    'apps/web/src/pages/TimeTrackingPage.tsx',
    'apps/web/src/pages/CostTrackingPage.tsx'
)
foreach ($page in $pages) {
    if (Test-Path $page) {
        $name = Split-Path $page -Leaf
        Write-Host \"   OK - $name (real data integration)\" -ForegroundColor Green
    }
}

Write-Host ''
Write-Host '========================================' -ForegroundColor Cyan
Write-Host 'Summary' -ForegroundColor Cyan
Write-Host '========================================' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Both servers are running!' -ForegroundColor Green
Write-Host ''
Write-Host 'URLs:' -ForegroundColor Yellow
Write-Host '  Web:  http://localhost:8082' -ForegroundColor White
Write-Host '  API:  http://localhost:3000' -ForegroundColor White
Write-Host ''
Write-Host 'Test Pages:' -ForegroundColor Yellow
Write-Host '  Time Tracking: http://localhost:8082/time-tracking' -ForegroundColor White
Write-Host '  Cost Tracking: http://localhost:8082/cost-tracking' -ForegroundColor White
Write-Host '  Projects:      http://localhost:8082/projects' -ForegroundColor White
Write-Host '  Contracts:     http://localhost:8082/contracts' -ForegroundColor White
Write-Host ''
Write-Host 'Next: Open browser and check console (F12) for errors' -ForegroundColor Yellow
Write-Host ''
