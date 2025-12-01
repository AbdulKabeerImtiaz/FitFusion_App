# RAG Service Reindex Script (PowerShell)
# Triggers reindexing of exercises and food items after bulk upload

Write-Host "🔄 RAG Service Reindex Script" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$RAG_URL = "http://localhost:8000"
$INTERNAL_API_KEY = "fitfusion-internal-key-2024"

# Check RAG service status
Write-Host "📊 Checking RAG service status..." -ForegroundColor Yellow

try {
    $statusResponse = Invoke-RestMethod -Uri "$RAG_URL/status" -Method Get
    Write-Host "✅ RAG service is running" -ForegroundColor Green
} catch {
    Write-Host "❌ RAG service is not responding" -ForegroundColor Red
    Write-Host "Please ensure containers are running: docker ps"
    exit 1
}
Write-Host ""

# Trigger reindex
Write-Host "🔄 Triggering full reindex..." -ForegroundColor Yellow

$headers = @{
    "X-API-Key" = $INTERNAL_API_KEY
    "Content-Type" = "application/json"
}

$body = @{
    mode = "full"
} | ConvertTo-Json

try {
    $reindexResponse = Invoke-RestMethod -Uri "$RAG_URL/reindex" `
        -Method Post `
        -Headers $headers `
        -Body $body
    
    Write-Host "✅ Reindex completed successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Gray
    $reindexResponse | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Reindex failed" -ForegroundColor Red
    Write-Host "Error: $_"
    Write-Host ""
    Write-Host "Alternative: Restart RAG container"
    Write-Host "  docker restart fitfusion-rag"
    exit 1
}
Write-Host ""

# Verify updated status
Write-Host "🔍 Verifying updated status..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $updatedStatus = Invoke-RestMethod -Uri "$RAG_URL/status" -Method Get
    $updatedStatus | ConvertTo-Json -Depth 10
} catch {
    Write-Host "⚠️  Could not verify status" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "🎉 RAG service reindexed successfully!" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The RAG service now has the latest exercises and food items."
Write-Host "You can now generate workout and diet plans!"
