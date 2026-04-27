<#
.SYNOPSIS
Sets Browser Use MCP environment variables for the current PowerShell session.

.DESCRIPTION
This helper prompts for one provider key at runtime and keeps the key only in
the current terminal process. It does not write secrets to disk.

.EXAMPLE
powershell -ExecutionPolicy Bypass -File .\01-runtime\tools\set-browser-use-env.ps1

.EXAMPLE
.\01-runtime\tools\set-browser-use-env.ps1 -Provider openai

.EXAMPLE
.\01-runtime\tools\set-browser-use-env.ps1 -Provider litellm
#>

param(
  [ValidateSet("openai", "anthropic", "litellm")]
  [string]$Provider = "",

  [ValidateSet("true", "false")]
  [string]$Headless = "false",

  [string]$OpenAIBaseUrl = "http://127.0.0.1:4000/v1"
)

function Convert-SecureStringToPlainText {
  param([securestring]$Value)

  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
  try {
    [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    if ($bstr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
  }
}

if ([string]::IsNullOrWhiteSpace($Provider)) {
  if (-not [string]::IsNullOrWhiteSpace($env:OPENAI_API_KEY)) {
    $Provider = "openai"
  } elseif (-not [string]::IsNullOrWhiteSpace($env:ANTHROPIC_API_KEY)) {
    $Provider = "anthropic"
  } else {
    $answer = Read-Host "Provider to set [litellm/openai/anthropic] (default: litellm)"
    if ([string]::IsNullOrWhiteSpace($answer)) {
      $Provider = "litellm"
    } else {
      $Provider = $answer.Trim().ToLowerInvariant()
    }
  }
}

if ($Provider -ne "openai" -and $Provider -ne "anthropic" -and $Provider -ne "litellm") {
  Write-Error "Provider must be 'litellm', 'openai', or 'anthropic'."
  exit 1
}

$targetEnvName = if ($Provider -eq "anthropic") { "ANTHROPIC_API_KEY" } else { "OPENAI_API_KEY" }
$existingValue = [Environment]::GetEnvironmentVariable($targetEnvName, "Process")
$shouldPromptForKey = [string]::IsNullOrWhiteSpace($existingValue)

if (-not $shouldPromptForKey) {
  $replace = Read-Host "$targetEnvName is already set in this terminal. Press Enter to keep it, or type REPLACE"
  $shouldPromptForKey = $replace -eq "REPLACE"
}

if ($shouldPromptForKey) {
  $keyLabel = if ($Provider -eq "litellm") { "LiteLLM master key as OPENAI_API_KEY" } else { $targetEnvName }
  $secureKey = Read-Host "Enter $keyLabel for this terminal session" -AsSecureString
  $plainKey = Convert-SecureStringToPlainText -Value $secureKey
  if ([string]::IsNullOrWhiteSpace($plainKey)) {
    Write-Error "$targetEnvName cannot be empty."
    exit 1
  }
  Set-Item -Path "Env:$targetEnvName" -Value $plainKey
}

if ($Provider -eq "litellm") {
  Set-Item -Path Env:OPENAI_BASE_URL -Value $OpenAIBaseUrl
  Remove-Item -Path Env:ANTHROPIC_API_KEY -ErrorAction SilentlyContinue
}

Set-Item -Path Env:BROWSER_USE_HEADLESS -Value $Headless

Write-Host "Browser Use environment prepared for this PowerShell session."
Write-Host "$targetEnvName is set: yes"
if ($Provider -eq "litellm") {
  Write-Host "OPENAI_BASE_URL=$env:OPENAI_BASE_URL"
  Write-Host "Expected LiteLLM model alias: browser-use-glm-5"
}
Write-Host "BROWSER_USE_HEADLESS=$env:BROWSER_USE_HEADLESS"
Write-Host ""
Write-Host "Next check:"
Write-Host "  node .\01-runtime\tools\browser-use-mcp-check.js"
