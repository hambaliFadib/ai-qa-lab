$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
$authPath = Join-Path $root '03-auth\state\dev-energy-auth.json'

if (-not (Test-Path -LiteralPath $authPath)) {
    Write-Host "Auth state file not found: $authPath" -ForegroundColor Red
    exit 1
}

$auth = Get-Content -Raw -LiteralPath $authPath | ConvertFrom-Json
$tokenEntry = $auth.origins.localStorage | Where-Object { $_.name -eq 'token' } | Select-Object -First 1

if (-not $tokenEntry) {
    Write-Host 'Token not found in auth state.' -ForegroundColor Yellow
    exit 1
}

try {
    $tokenPayload = $tokenEntry.value | ConvertFrom-Json
    $tokenPayload | ConvertTo-Json -Depth 5
} catch {
    Write-Host 'Token found, but value is not JSON. Raw value below.' -ForegroundColor Yellow
    Write-Output $tokenEntry.value
}