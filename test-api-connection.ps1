Write-Host "=== API Connection Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if port 8080 is listening
Write-Host "1. Checking if port 8080 is in use..." -ForegroundColor Yellow
$port = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($port) {
    Write-Host "   OK Port 8080 is listening" -ForegroundColor Green
} else {
    Write-Host "   FAIL Port 8080 is NOT listening" -ForegroundColor Red
    Write-Host "   Start API with: cd apps/api; npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Try to access health endpoint
Write-Host ""
Write-Host "2. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   OK Health endpoint responded" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   FAIL Health endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    exit 1
}

# Test 3: Try to access API v1 endpoint
Write-Host ""
Write-Host "3. Testing API v1 endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1" -UseBasicParsing -TimeoutSec 5
    Write-Host "   OK API v1 endpoint responded" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "   FAIL API v1 endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test 4: Check CORS configuration
Write-Host ""
Write-Host "4. Testing CORS configuration..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "http://localhost:8081"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/v1" -Headers $headers -UseBasicParsing -TimeoutSec 5
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "   OK CORS is configured" -ForegroundColor Green
        Write-Host "   Allowed Origin: $corsHeader" -ForegroundColor Gray
    } else {
        Write-Host "   WARN CORS header not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   FAIL CORS test failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
