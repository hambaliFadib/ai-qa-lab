$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$authPath = Join-Path $root '03-auth\state\dev-energy-auth.json'
$artifactPath = Join-Path $root '01-runtime\artifacts\adhoc-notes\api-discovery-report.json'
$baseUrl = if ($env:PGN_BASE_URL) { $env:PGN_BASE_URL.TrimEnd('/') } else { 'https://dev-energy.pgn.co.id' }

if (-not (Test-Path -LiteralPath $authPath)) {
    Write-Host "Auth state file not found: $authPath" -ForegroundColor Red
    exit 1
}

$auth = Get-Content -Raw -LiteralPath $authPath | ConvertFrom-Json
$tokenEntry = $auth.origins.localStorage | Where-Object { $_.name -eq 'token' } | Select-Object -First 1

if (-not $tokenEntry) {
    Write-Host 'Token entry not found in auth state.' -ForegroundColor Red
    exit 1
}

$tokenPayload = $null
try {
    $tokenPayload = $tokenEntry.value | ConvertFrom-Json
} catch {
    $tokenPayload = $null
}

if (-not $tokenPayload -or -not $tokenPayload.accessToken) {
    Write-Host 'Access token not available in auth state.' -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $($tokenPayload.accessToken)"
    'Content-Type' = 'application/json'
}

$endpoints = @(
    @{ method = 'GET'; path = '/um/v1/dbs/api/profile/view-profile'; purpose = 'profile' },
    @{ method = 'POST'; path = '/um/v1/dbs/api/auth/check-granted-access'; purpose = 'menu-access' },
    @{ method = 'GET'; path = '/rbi/v1/dbs/api/billingitem/get-paging'; purpose = 'transaction-mapping-list' }
)

$results = @()

foreach ($endpoint in $endpoints) {
    $url = "$baseUrl$($endpoint.path)"
    $body = if ($endpoint.path -like '*check-granted-access*') { '{"moduleCode":"RBI"}' } else { $null }

    try {
        $response = if ($endpoint.method -eq 'POST') {
            Invoke-RestMethod -Uri $url -Method $endpoint.method -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 20
        } else {
            Invoke-RestMethod -Uri $url -Method $endpoint.method -Headers $headers -TimeoutSec 20
        }

        $results += [pscustomobject]@{
            method = $endpoint.method
            path = $endpoint.path
            purpose = $endpoint.purpose
            success = $true
            notes = 'Request completed'
        }
    } catch {
        $statusCode = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }

        $results += [pscustomobject]@{
            method = $endpoint.method
            path = $endpoint.path
            purpose = $endpoint.purpose
            success = $false
            notes = if ($statusCode) { "HTTP $statusCode" } else { $_.Exception.Message }
        }
    }
}

$output = [pscustomobject]@{
    generatedAt = (Get-Date).ToString('s')
    baseUrl = $baseUrl
    username = $tokenPayload.username
    results = $results
}

$output | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $artifactPath
$output | ConvertTo-Json -Depth 5