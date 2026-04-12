$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..\..'))
$authPath = Join-Path $root '03-auth\state\dev-energy-auth.json'

if (-not (Test-Path -LiteralPath $authPath)) {
    Write-Host "Auth state file not found: $authPath" -ForegroundColor Red
    exit 1
}

$auth = Get-Content -Raw -LiteralPath $authPath | ConvertFrom-Json
$tokenEntry = $auth.origins.localStorage | Where-Object { $_.name -eq 'token' } | Select-Object -First 1
$tokenPayload = $null

if ($tokenEntry) {
    try {
        $tokenPayload = $tokenEntry.value | ConvertFrom-Json
    } catch {
        $tokenPayload = $null
    }
}

Write-Host '=== Session Status ===' -ForegroundColor Cyan
Write-Host ''
Write-Host "Auth file: $authPath"
Write-Host "Cookies : $($auth.cookies.Count)"
Write-Host "Origins : $($auth.origins.Count)"

foreach ($cookie in $auth.cookies) {
    Write-Host ''
    Write-Host "Cookie: $($cookie.name)"

    if ($cookie.expires -is [double] -and $cookie.expires -gt 0) {
        $cookieDate = [DateTimeOffset]::FromUnixTimeSeconds([int64]$cookie.expires).LocalDateTime
        $isExpired = $cookieDate -lt (Get-Date)
        Write-Host "  Expires : $cookieDate"
        Write-Host "  Expired : $isExpired"
    } else {
        Write-Host '  Expires : Session'
    }
}

Write-Host ''
if ($tokenPayload) {
    Write-Host 'Token summary:' -ForegroundColor Cyan
    Write-Host "  Username   : $($tokenPayload.username)"
    Write-Host "  User Level : $($tokenPayload.userLevel)"
    Write-Host "  Expires    : $($tokenPayload.dateExpired)"
} else {
    Write-Host 'Token summary: token field not available or not JSON.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host "Current time: $(Get-Date)"