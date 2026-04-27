@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"

set "BROWSER_USE_ENV_FILE=%ROOT%\02-brain\.opencode\config\browser-use.local.env"
if exist "%BROWSER_USE_ENV_FILE%" (
  for /f "usebackq eol=# tokens=1* delims==" %%A in ("%BROWSER_USE_ENV_FILE%") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

if not defined BROWSER_USE_HEADLESS set "BROWSER_USE_HEADLESS=false"

where uvx >nul 2>nul
if errorlevel 1 (
  echo uvx was not found in PATH. Browser Use MCP cannot start.
  exit /b 1
)

uvx --from "browser-use[cli]" browser-use --mcp
exit /b %ERRORLEVEL%
