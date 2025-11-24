# PowerShell script to add 'export const dynamic = force-dynamic' to all API route files
# that are missing it

$routeFiles = Get-ChildItem -Path "d:\LeaderBoard and Audit Site\app\api" -Recurse -Filter "route.ts"

$modified = @()
$alreadyHas = @()

foreach ($file in $routeFiles) {
    $content = Get-Content $file.FullName -Raw

    if ($content -notmatch "export const dynamic") {
        # Add the export at the end
        $content = $content.TrimEnd()
        $content += "`n`nexport const dynamic = 'force-dynamic';`n"

        Set-Content -Path $file.FullName -Value $content -NoNewline
        $modified += $file.FullName
        Write-Host "Added to: $($file.FullName)" -ForegroundColor Green
    } else {
        $alreadyHas += $file.FullName
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "Modified: $($modified.Count) files" -ForegroundColor Green
Write-Host "Already had export: $($alreadyHas.Count) files" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

if ($modified.Count -gt 0) {
    Write-Host "Modified files:" -ForegroundColor Green
    $modified | ForEach-Object { Write-Host "  - $_" }
}
