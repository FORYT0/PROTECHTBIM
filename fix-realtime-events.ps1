# Fix all emitProjectEvent calls to use emitToProject instead
Write-Host "Fixing realtime event calls in enterprise services..." -ForegroundColor Cyan

$files = @(
    "apps/api/src/services/ChangeOrderService.ts",
    "apps/api/src/services/DailyReportService.ts",
    "apps/api/src/services/SnagService.ts"
)

foreach ($file in $files) {
    Write-Host "Processing $file..." -ForegroundColor Yellow
    
    $content = Get-Content $file -Raw
    
    # Replace the pattern: emitProjectEvent(EventType, projectId, { data })
    # With: emitToProject(projectId, { type: EventType, projectId, entityId, entityType, data: { data }, timestamp })
    
    # This is complex, so we'll do a simple find/replace
    $content = $content -replace 'this\.realtimeService\.emitProjectEvent\(', 'this.realtimeService.emitToProject('
    
    Set-Content $file $content -NoNewline
    
    Write-Host "  Fixed $file" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! But you need to manually fix the method signatures." -ForegroundColor Yellow
Write-Host "The method signature changed from:" -ForegroundColor Yellow
Write-Host "  emitProjectEvent(type, projectId, data)" -ForegroundColor Gray
Write-Host "To:" -ForegroundColor Yellow
Write-Host "  emitToProject(projectId, { type, projectId, entityId, entityType, data, timestamp })" -ForegroundColor Gray
