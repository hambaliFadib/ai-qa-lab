<#
.SYNOPSIS
Ensures the local LiteLLM proxy for Browser Use -> OpenCode Go is running.

.DESCRIPTION
This helper is intentionally idempotent. It reads the local LiteLLM env profile,
checks whether the configured host/port is already listening, and starts
start-litellm-opencode-go.ps1 in the background only when needed.

No secret values are printed or placed on the process command line.
#>

param(
  [string]$EnvPath = "02-brain\.opencode\config\litellm-opencode-go.local.env",
  [string]$ConfigPath = "02-brain\.opencode\config\litellm-opencode-go.glm-5.yaml",
  [string]$StartScriptPath = "01-runtime\tools\start-litellm-opencode-go.ps1",
  [string]$LogDir = "01-runtime\temp\litellm-opencode-go",
  [int]$StartupTimeoutSeconds = 30,
  [switch]$CheckOnly,
  [switch]$Quiet
)

function Resolve-WorkspacePath {
  param([string]$PathValue)

  if ([System.IO.Path]::IsPathRooted($PathValue)) {
    return $PathValue
  }

  return Join-Path (Get-Location) $PathValue
}

function Normalize-EnvValue {
  param([string]$Value)

  $trimmed = $Value.Trim()
  if (
    ($trimmed.StartsWith('"') -and $trimmed.EndsWith('"')) -or
    ($trimmed.StartsWith("'") -and $trimmed.EndsWith("'"))
  ) {
    return $trimmed.Substring(1, $trimmed.Length - 2)
  }

  return $trimmed
}

function Read-LocalEnv {
  param([string]$PathValue)

  $values = @{}
  if (-not (Test-Path -LiteralPath $PathValue)) {
    return $values
  }

  Get-Content -LiteralPath $PathValue | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) {
      return
    }

    $separator = $line.IndexOf("=")
    if ($separator -le 0) {
      return
    }

    $name = $line.Substring(0, $separator).Trim()
    $value = Normalize-EnvValue -Value $line.Substring($separator + 1)
    $values[$name] = $value
  }

  return $values
}

function Test-TcpPort {
  param(
    [string]$HostAddress,
    [int]$Port,
    [int]$TimeoutMs = 800
  )

  $client = [System.Net.Sockets.TcpClient]::new()
  try {
    $async = $client.BeginConnect($HostAddress, $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
      return $false
    }

    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Write-Status {
  param([string]$Message)

  if (-not $Quiet) {
    Write-Host $Message
  }
}

$envFile = Resolve-WorkspacePath -PathValue $EnvPath
$configFile = Resolve-WorkspacePath -PathValue $ConfigPath
$startScript = Resolve-WorkspacePath -PathValue $StartScriptPath
$resolvedLogDir = Resolve-WorkspacePath -PathValue $LogDir

if (-not (Test-Path -LiteralPath $envFile)) {
  Write-Status "LiteLLM auto-start skipped: missing $envFile"
  exit 0
}

if (-not (Test-Path -LiteralPath $configFile)) {
  Write-Status "LiteLLM auto-start skipped: missing $configFile"
  exit 0
}

if (-not (Test-Path -LiteralPath $startScript)) {
  Write-Status "LiteLLM auto-start skipped: missing $startScript"
  exit 0
}

$localEnv = Read-LocalEnv -PathValue $envFile
$hostAddress = if ([string]::IsNullOrWhiteSpace($localEnv.LITELLM_HOST)) {
  "127.0.0.1"
} else {
  [string]$localEnv.LITELLM_HOST
}
$port = if ([string]::IsNullOrWhiteSpace($localEnv.LITELLM_PORT)) {
  4000
} else {
  [int]$localEnv.LITELLM_PORT
}

if ([string]::IsNullOrWhiteSpace($localEnv.OPENCODE_GO_API_KEY)) {
  Write-Status "LiteLLM auto-start skipped: OPENCODE_GO_API_KEY is empty in $envFile"
  exit 0
}

if ([string]::IsNullOrWhiteSpace($localEnv.LITELLM_MASTER_KEY)) {
  Write-Status "LiteLLM auto-start skipped: LITELLM_MASTER_KEY is empty in $envFile"
  exit 0
}

if (Test-TcpPort -HostAddress $hostAddress -Port $port) {
  Write-Status "LiteLLM proxy already listening at http://$hostAddress`:$port/v1"
  exit 0
}

if ($CheckOnly) {
  Write-Status "LiteLLM proxy is not listening at http://$hostAddress`:$port/v1"
  exit 1
}

New-Item -ItemType Directory -Force -Path $resolvedLogDir | Out-Null

$stdoutLog = Join-Path $resolvedLogDir "litellm.out.log"
$stderrLog = Join-Path $resolvedLogDir "litellm.err.log"
$pidPath = Join-Path $resolvedLogDir "litellm.pid"
$powershell = Join-Path $PSHOME "powershell.exe"
if (-not (Test-Path -LiteralPath $powershell)) {
  $powershellCommand = Get-Command -Name powershell.exe -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $powershellCommand) {
    Write-Status "LiteLLM auto-start failed: powershell.exe was not found."
    exit 0
  }
  $powershell = $powershellCommand.Source
}

$arguments = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $startScript,
  "-EnvPath",
  $envFile,
  "-ConfigPath",
  $configFile
)

Write-Status "Starting LiteLLM proxy for Browser Use at http://$hostAddress`:$port/v1"
$process = Start-Process `
  -FilePath $powershell `
  -ArgumentList $arguments `
  -WindowStyle Hidden `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog `
  -PassThru

Set-Content -LiteralPath $pidPath -Value "$($process.Id)" -Encoding ASCII

$deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Milliseconds 500
  if (Test-TcpPort -HostAddress $hostAddress -Port $port) {
    Write-Status "LiteLLM proxy ready at http://$hostAddress`:$port/v1"
    exit 0
  }
}

Write-Status "LiteLLM proxy did not become ready within $StartupTimeoutSeconds seconds; OpenCode will continue. Check $stderrLog"
exit 0
