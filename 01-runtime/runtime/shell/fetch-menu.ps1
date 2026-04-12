$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$authPath = Join-Path $root '03-auth\state\dev-energy-auth.json'
$outputPath = Join-Path $root '01-runtime\artifacts\adhoc-notes\menu-structure.json'
$baseUrl = if ($env:PGN_BASE_URL) { $env:PGN_BASE_URL.TrimEnd('/') } else { 'https://dev-energy.pgn.co.id' }

if (-not (Test-Path -LiteralPath $authPath)) {
    Write-Host "Auth state file not found: $authPath" -ForegroundColor Red
    exit 1
}

$auth = Get-Content -Raw -LiteralPath $authPath | ConvertFrom-Json
$tokenEntry = $auth.origins.localStorage | Where-Object { $_.name -eq 'token' } | Select-Object -First 1
$tokenPayload = $tokenEntry.value | ConvertFrom-Json
$headers = @{
    Authorization = "Bearer $($tokenPayload.accessToken)"
    'Content-Type' = 'application/json'
}

$body = '{"moduleCode":"RBI"}'
$response = Invoke-RestMethod -Uri "$baseUrl/um/v1/dbs/api/auth/check-granted-access" -Method POST -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 20
$response | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $outputPath
$response | ConvertTo-Json -Depth 8