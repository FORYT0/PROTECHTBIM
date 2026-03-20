Write-Host 'Testing API Server on different ports...' -ForegroundColor Yellow
Write-Host ''

$ports = @(3000, 3001, 8080, 8081, 5000)
foreach ($port in $ports) {
    try {
        $r = Invoke-WebRequest -Uri \"http://localhost:$port/api/v1/health\" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host \"OK - API found on port $port\" -ForegroundColor Green
        Write-Host \"Health check: $($r.Content)\" -ForegroundColor Gray
        break
    } catch {
        Write-Host \"Port $port - not responding\" -ForegroundColor Gray
    }
}

Write-Host ''
Write-Host 'Checking if API process is running...' -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime | Format-Table
