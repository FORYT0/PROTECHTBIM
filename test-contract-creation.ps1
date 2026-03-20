# Test contract creation with actual auth token
Write-Host "=== Testing Contract Creation ===" -ForegroundColor Cyan
Write-Host ""

# You need to replace this with your actual token from localStorage
$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwN2IyYjcwZC1kMjIyLTRkNWQtODE2NC1lNzE1NzM2NThlMDgiLCJlbWFpbCI6ImtlLm1hbmFnZS51c0BnbWFpbC5jb20iLCJyb2xlcyI6W10sImlhdCI6MTc3MTkyMzE0MiwiZXhwIjoxNzcxOTI2NzQyfQ.UtvsIOtys8jb6NsYj_gyGN0DCSpMHgaTLHs1OrhiOX0"

$contractData = @{
    projectId = "87ad666e-ff72-4151-b02b-455e9fa8a6a8"
    contractNumber = "TEST-PS-001"
    contractType = "LUMP_SUM"
    clientName = "Test Client PowerShell"
    originalContractValue = 100000
    originalDurationDays = 90
    startDate = "2026-02-24"
    completionDate = "2026-05-25"
    retentionPercentage = 10
    advancePaymentAmount = 10000
    performanceBondValue = 5000
    currency = "USD"
    description = "Test contract from PowerShell"
    terms = "Standard terms"
} | ConvertTo-Json

Write-Host "Request Data:" -ForegroundColor Yellow
Write-Host $contractData
Write-Host ""

try {
    Write-Host "Sending POST request..." -ForegroundColor Yellow
    
    $headers = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    $response = Invoke-WebRequest `
        -Uri "http://localhost:8080/api/v1/contracts" `
        -Method POST `
        -Headers $headers `
        -Body $contractData `
        -UseBasicParsing `
        -TimeoutSec 10
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    Write-Host $response.Content
    
} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
