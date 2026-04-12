@echo off
setlocal

set "ROOT=%~dp0\..\.."
if not defined APP_URL set "APP_URL=https://dev-energy.pgn.co.id"
if not defined CDP_PORT set "CDP_PORT=9222"
if not defined PROFILE_DIR set "PROFILE_DIR=%ROOT%\03-auth\chrome-profile"
set "BROWSER_BIN=%ProgramFiles%\Google\Chrome\Application\chrome.exe"

if not exist "%BROWSER_BIN%" set "BROWSER_BIN=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%BROWSER_BIN%" set "BROWSER_BIN=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if not exist "%BROWSER_BIN%" (
  echo Browser executable not found. Update 01-runtime\tools\start-browser.bat if your browser is installed elsewhere.
  exit /b 1
)

start "" "%BROWSER_BIN%" --remote-debugging-port=%CDP_PORT% --user-data-dir="%PROFILE_DIR%" "%APP_URL%"
endlocal