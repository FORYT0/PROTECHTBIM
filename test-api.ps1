# PROTECHT BIM API Test Script
# Tests the production API endpoints

$baseUrl = "http://localhost:3000"
$apiUrl = "$baseUrl/api/v1"

Write-Host ""
Write-Host "Testing PROTECHT BIM Production API" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Uptime: $([math]::Round($health.uptime, 2))s" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: API Info
Write-Host "2. API Info..." -ForegroundColor Yellow
try {
    $info = Invoke-RestMethod -Uri $apiUrl -Method Get
    Write-Host "   Name: $($info.name)" -ForegroundColor Green
    Write-Host "   Version: $($info.version)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Register a Test User
Write-Host "3. Register Test User..." -ForegroundColor Yellow
$registerData = @{
    email = "test@protecht.com"
    password = "Test123!@#"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$apiUrl/auth/register" -Method Post -Body $registerData -ContentType "application/json"
    Write-Host "   User registered: $($register.user.email)" -ForegroundColor Green
    Write-Host "   User ID: $($register.user.id)" -ForegroundColor Green
    Write-Host ""
    $token = $register.token
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "   User already exists, trying login..." -ForegroundColor Yellow
        Write-Host ""
        
        # Test 4: Login
        Write-Host "4. Login..." -ForegroundColor Yellow
        $loginData = @{
            email = "test@protecht.com"
            password = "Test123!@#"
        } | ConvertTo-Json
        
        try {
            $login = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post -Body $loginData -ContentType "application/json"
            Write-Host "   Login successful" -ForegroundColor Green
            Write-Host "   Token received" -ForegroundColor Green
            Write-Host ""
            $token = $login.token
        } catch {
            Write-Host "   Login failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host ""
        }
    } else {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# Test 5: Get Current User (requires auth)
if ($token) {
    Write-Host "5. Get Current User..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    try {
        $user = Invoke-RestMethod -Uri "$apiUrl/auth/me" -Method Get -Headers $headers
        Write-Host "   User: $($user.firstName) $($user.lastName)" -ForegroundColor Green
        Write-Host "   Email: $($user.email)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }

    # Test 6: Create a Project
    Write-Host "6. Create Test Project..." -ForegroundColor Yellow
    $projectData = @{
        name = "Test Project $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        description = "Test project created via API"
        startDate = (Get-Date).ToString("yyyy-MM-dd")
        status = "active"
    } | ConvertTo-Json
    
    try {
        $project = Invoke-RestMethod -Uri "$apiUrl/projects" -Method Post -Body $projectData -ContentType "application/json" -Headers $headers
        Write-Host "   Project created: $($project.name)" -ForegroundColor Green
        Write-Host "   Project ID: $($project.id)" -ForegroundColor Green
        Write-Host ""
        $projectId = $project.id
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }

    # Test 7: List Projects
    Write-Host "7. List Projects..." -ForegroundColor Yellow
    try {
        $projects = Invoke-RestMethod -Uri "$apiUrl/projects" -Method Get -Headers $headers
        Write-Host "   Found $($projects.Count) project(s)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host ""
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "API Documentation: $apiUrl" -ForegroundColor Blue
Write-Host "Health Check: $baseUrl/health" -ForegroundColor Blue
Write-Host ""
