<#
.SYNOPSIS
Starts a local LiteLLM proxy that routes Browser Use to OpenCode Go glm-5.

.DESCRIPTION
Loads local secrets from 02-brain/.opencode/config/litellm-opencode-go.local.env
and starts LiteLLM with the tracked glm-5 config. Secrets are never written to
source-controlled files.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\01-runtime\tools\start-litellm-opencode-go.ps1
#>

param(
  [string]$EnvPath = "02-brain\.opencode\config\litellm-opencode-go.local.env",
  [string]$ConfigPath = "02-brain\.opencode\config\litellm-opencode-go.glm-5.yaml",
  [string]$HostAddress = "",
  [int]$Port = 0
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

function Import-LocalEnv {
  param([string]$PathValue)

  if (-not (Test-Path -LiteralPath $PathValue)) {
    Write-Error "Missing local env file: $PathValue. Copy litellm-opencode-go.local.env.example and fill OPENCODE_GO_API_KEY plus LITELLM_MASTER_KEY."
    exit 1
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
    Set-Item -Path "Env:$name" -Value $value
  }
}

$envFile = Resolve-WorkspacePath -PathValue $EnvPath
$configFile = Resolve-WorkspacePath -PathValue $ConfigPath

Import-LocalEnv -PathValue $envFile

# LiteLLM's Click CLI treats DEBUG as an implicit --debug value. Some local
# shells set DEBUG=release, which is valid for other tools but invalid here.
Remove-Item -Path Env:DEBUG -ErrorAction SilentlyContinue

# LiteLLM prints a unicode banner on startup. Force UTF-8 so redirected logs on
# Windows do not crash under the default cp1252 code page.
Set-Item -Path Env:PYTHONUTF8 -Value "1"
Set-Item -Path Env:PYTHONIOENCODING -Value "utf-8"

if ([string]::IsNullOrWhiteSpace($env:OPENCODE_GO_API_KEY)) {
  Write-Error "OPENCODE_GO_API_KEY is missing. Put the OpenCode Go API key in $envFile."
  exit 1
}

if ([string]::IsNullOrWhiteSpace($env:LITELLM_MASTER_KEY)) {
  Write-Error "LITELLM_MASTER_KEY is missing. Use a local proxy key and reuse it as Browser Use OPENAI_API_KEY."
  exit 1
}

if (-not (Test-Path -LiteralPath $configFile)) {
  Write-Error "Missing LiteLLM config: $configFile"
  exit 1
}

if ([string]::IsNullOrWhiteSpace($HostAddress)) {
  $HostAddress = if ([string]::IsNullOrWhiteSpace($env:LITELLM_HOST)) { "127.0.0.1" } else { $env:LITELLM_HOST }
}

if ($Port -le 0) {
  $Port = if ([string]::IsNullOrWhiteSpace($env:LITELLM_PORT)) { 4000 } else { [int]$env:LITELLM_PORT }
}

$arguments = @("--config", $configFile, "--host", $HostAddress, "--port", "$Port")

Write-Host "Starting LiteLLM proxy for Browser Use -> OpenCode Go glm-5"
Write-Host "Config: $configFile"
Write-Host "URL: http://$HostAddress`:$Port/v1"
Write-Host "Model alias: browser-use-glm-5"

$uvx = Get-Command -Name uvx -ErrorAction SilentlyContinue | Select-Object -First 1
$litellm = Get-Command -Name litellm -ErrorAction SilentlyContinue | Select-Object -First 1

if ($uvx) {
  & $uvx.Source --from "litellm[proxy]" litellm @arguments
  exit $LASTEXITCODE
}

if ($litellm) {
  & $litellm.Source @arguments
  exit $LASTEXITCODE
}

if (-not $uvx -and -not $litellm) {
  Write-Error "Neither litellm nor uvx was found in PATH. Install LiteLLM proxy or uv first."
  exit 1
}
