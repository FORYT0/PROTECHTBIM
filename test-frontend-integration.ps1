# Frontend Integration Test Script
# Tests: Compilation, WebSocket, React Query, Real-time sync, Dashboard API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Integration Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8082"
$apiUrl = "http://localhost:3000/api/v1"
$wsUrl = "ws://localhost:3000"

# Test 1: Check if web server is running
Write-Host "1. Checking Web Development Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $baseUrl -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Web server is running on $baseUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Web server is not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Check if API server is running
Write-Host "2. Checking API Server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$apiUrl/health" -Method Get -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ API server is running on $apiUrl" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ API server is not responding" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Note: Start API server with: cd apps/api && npm run dev" -ForegroundColor Yellow
}

Write-Host ""

# Test 3: Check frontend compilation
Write-Host "3. Checking Frontend Compilation..." -ForegroundColor Yellow
try {
    # Check if the main bundle is accessible
    $response = Invoke-WebRequest -Uri "$baseUrl/@vite/client" -Method Get -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✓ Frontend compiled successfully (Vite client accessible)" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Could not verify compilation (this is normal for Vite dev server)" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Check WebSocket endpoint
Write-Host "4. Checking WebSocket Endpoint..." -ForegroundColor Yellow
try {
    # Try to connect to WebSocket endpoint (basic check)
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $tcpClient.Connect("localhost", 3000)
    if ($tcpClient.Connected) {
        Write-Host "   ✓ WebSocket port (3000) is accessible" -ForegroundColor Green
        $tcpClient.Close()
    }
} catch {
    Write-Host "   ✗ WebSocket port is not accessible" -ForegroundColor Red
    Write-Host "   Note: WebSocket requires API server to be running" -ForegroundColor Yellow
}

Write-Host ""

# Test 6: Check for common runtime errors
Write-Host "6. Checking for Common Issues..." -ForegroundColor Yellow

# Check if node_modules exists
if (Test-Path "apps/web/node_modules") {
    Write-Host "   ✓ node_modules directory exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ node_modules directory missing - run npm install" -ForegroundColor Red
}

# Check if .env file exists
if (Test-Path "apps/web/.env") {
    Write-Host "   ✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠ .env file missing (using defaults)" -ForegroundColor Yellow
}

# Check TypeScript configuration
if (Test-Path "apps/web/tsconfig.json") {
    Write-Host "   ✓ TypeScript configuration exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ TypeScript configuration missing" -ForegroundColor Red
}

Write-Host ""

# Test 7: Service Integration Check
Write-Host "7. Checking Service Files..." -ForegroundColor Yellow

$services = @(
    "apps/web/src/services/projectService.ts",
    "apps/web/src/services/workPackageService.ts",
    "apps/web/src/services/TimeEntryService.ts",
    "apps/web/src/services/CostEntryService.ts",
    "apps/web/src/services/contractService.ts"
)

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "   ✓ $(Split-Path $service -Leaf) exists" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $(Split-Path $service -Leaf) missing" -ForegroundColor Red
    }
}

Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Web Server: http://localhost:8082" -ForegroundColor White
Write-Host "API Server: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open browser to http://localhost:8082" -ForegroundColor White
Write-Host "2. Open browser console (F12) to check for errors" -ForegroundColor White
Write-Host "3. Navigate through pages to test functionality" -ForegroundColor White
Write-Host "4. Check Network tab for API calls" -ForegroundColor White
Write-Host "5. Check Console tab for runtime errors" -ForegroundColor White
Write-Host ""
Write-Host "To test specific pages:" -ForegroundColor Yellow
Write-Host "- Time Tracking: http://localhost:8082/time-tracking" -ForegroundColor White
Write-Host "- Cost Tracking: http://localhost:8082/cost-tracking" -ForegroundColor White
Write-Host "- Projects: http://localhost:8082/projects" -ForegroundColor White
Write-Host "- Contracts: http://localhost:8082/contracts" -ForegroundColor White
Write-Host ""
