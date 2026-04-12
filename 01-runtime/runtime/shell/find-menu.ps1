param(
    [string]$Keyword = 'Transaction'
)

$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\..'))
$menuPath = Join-Path $root '01-runtime\artifacts\adhoc-notes\menu-structure.json'

if (-not (Test-Path -LiteralPath $menuPath)) {
    Write-Host 'Menu structure not found. Run shell\fetch-menu.ps1 first.' -ForegroundColor Yellow
    exit 1
}

$menu = Get-Content -Raw -LiteralPath $menuPath | ConvertFrom-Json
$menu | ConvertTo-Json -Depth 10 | Select-String -Pattern $Keyword -Context 0,2