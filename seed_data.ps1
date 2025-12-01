# FitFusion Data Seeding Script (PowerShell)
# This script seeds exercises and food items into the database

Write-Host "🌱 FitFusion Data Seeding Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BASE_URL = "http://localhost:8080/api"
$ADMIN_EMAIL = "admin@fitfusion.com"
$ADMIN_PASSWORD = "admin123"  # Change this if your admin password is different

# Step 1: Login as admin
Write-Host "📝 Step 1: Logging in as admin..." -ForegroundColor Yellow

$loginBody = @{
    email = $ADMIN_EMAIL
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody
    
    $TOKEN = $loginResponse.token
    
    if (-not $TOKEN) {
        Write-Host "❌ Login failed. Please check admin credentials." -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Login successful" -ForegroundColor Green
    Write-Host "Token: $($TOKEN.Substring(0, [Math]::Min(20, $TOKEN.Length)))..."
    Write-Host ""
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}

# Step 2: Upload exercises
Write-Host "🏋️  Step 2: Uploading exercises from sample_exercises.json..." -ForegroundColor Yellow

if (-not (Test-Path "sample_exercises.json")) {
    Write-Host "❌ sample_exercises.json not found!" -ForegroundColor Red
    exit 1
}

$exercisesJson = Get-Content "sample_exercises.json" -Raw

try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    $exercisesResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/exercises/bulk" `
        -Method Post `
        -Headers $headers `
        -Body $exercisesJson
    
    Write-Host "✅ Exercises uploaded successfully" -ForegroundColor Green
    
    # Count exercises
    $exerciseCount = ([regex]::Matches($exercisesJson, '"name"')).Count
    Write-Host "   Uploaded approximately $exerciseCount exercises"
    Write-Host ""
} catch {
    Write-Host "❌ Failed to upload exercises: $_" -ForegroundColor Red
    Write-Host ""
}

# Step 3: Upload food items
Write-Host "🍎 Step 3: Uploading food items from sample_food_items.json..." -ForegroundColor Yellow

if (-not (Test-Path "sample_food_items.json")) {
    Write-Host "❌ sample_food_items.json not found!" -ForegroundColor Red
    exit 1
}

$foodJson = Get-Content "sample_food_items.json" -Raw

try {
    $foodResponse = Invoke-RestMethod -Uri "$BASE_URL/admin/food-items/bulk" `
        -Method Post `
        -Headers $headers `
        -Body $foodJson
    
    Write-Host "✅ Food items uploaded successfully" -ForegroundColor Green
    
    # Count food items
    $foodCount = ([regex]::Matches($foodJson, '"food_name"')).Count
    Write-Host "   Uploaded approximately $foodCount food items"
    Write-Host ""
} catch {
    Write-Host "❌ Failed to upload food items: $_" -ForegroundColor Red
    Write-Host ""
}

# Step 4: Verify data
Write-Host "🔍 Step 4: Verifying data..." -ForegroundColor Yellow

try {
    $exerciseCheck = Invoke-RestMethod -Uri "$BASE_URL/admin/exercises" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Exercises verified in database" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify exercises" -ForegroundColor Yellow
}

try {
    $foodCheck = Invoke-RestMethod -Uri "$BASE_URL/admin/food-items" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Food items verified in database" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not verify food items" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Data seeding complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Register a user account at http://localhost"
Write-Host "2. Set your preferences"
Write-Host "3. Generate your first workout plan!"
