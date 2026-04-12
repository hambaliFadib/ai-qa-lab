$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$authPath = Join-Path $root '03-auth\state\dev-energy-auth.json'
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

Write-Host 'Testing profile endpoint...' -ForegroundColor Cyan
Invoke-RestMethod -Uri "$baseUrl/um/v1/dbs/api/profile/view-profile" -Method GET -Headers $headers -TimeoutSec 20 | ConvertTo-Json -Depth 5