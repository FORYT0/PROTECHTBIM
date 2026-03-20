# Test Enterprise Modules
# This script tests all enterprise module endpoints

$baseUrl = "http://localhost:3000"
$token = "your-auth-token-here"

Write-Host "Testing Enterprise Module Endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test Contracts
Write-Host "1. Testing Contracts..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/contracts" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "   ✓ Contracts endpoint working" -ForegroundColor Green
    Write-Host "   Found $($response.contracts.Count) contracts" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Contracts endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Change Orders
Write-Host "2. Testing Change Orders..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/change-orders" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "   ✓ Change Orders endpoint working" -ForegroundColor Green
    Write-Host "   Found $($response.changeOrders.Count) change orders" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Change Orders endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Daily Reports
Write-Host "3. Testing Daily Reports..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/daily-reports" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "   ✓ Daily Reports endpoint working" -ForegroundColor Green
    Write-Host "   Found $($response.dailyReports.Count) daily reports" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Daily Reports endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test Snags
Write-Host "4. Testing Snags..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/snags" -Method Get -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    Write-Host "   ✓ Snags endpoint working" -ForegroundColor Green
    Write-Host "   Found $($response.snags.Count) snags" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Snags endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Update the token variable at the top of this script with your actual auth token" -ForegroundColor Yellow
