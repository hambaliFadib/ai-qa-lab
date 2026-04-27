@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
set "TOOLS=%ROOT%\01-runtime\tools"
set "WEB=%ROOT%\07-falid-shell\web"
set "COMMAND=%~1"

if "%COMMAND%"=="" (
  call "%TOOLS%\opencode-local.cmd"
  exit /b %ERRORLEVEL%
)

if /I "%COMMAND%"=="serve" (
  shift
  call "%TOOLS%\opencode-local.cmd" serve %*
  exit /b %ERRORLEVEL%
)

if /I "%COMMAND%"=="web" goto :web
if /I "%COMMAND%"=="doctor" goto :doctor
if /I "%COMMAND%"=="smoke" goto :smoke
if /I "%COMMAND%"=="session" goto :session
if /I "%COMMAND%"=="release-check" goto :releasecheck

call "%TOOLS%\opencode-local.cmd" %*
exit /b %ERRORLEVEL%

:web
if not exist "%WEB%\node_modules" (
  echo FALID web shell dependencies are missing.
  echo Run:
  echo   cd /d "%WEB%"
  echo   npm install
  exit /b 1
)

echo Starting FALID web shell and OpenCode backend...
node "%ROOT%\07-falid-shell\scripts\start-opencode.js"
if errorlevel 1 exit /b %ERRORLEVEL%
start "FALID Shell" cmd /k "cd /d ""%WEB%"" && set FALID_AUTO_OPEN=1 && npm.cmd run dev"
exit /b 0

:doctor
node "%TOOLS%\falid-doctor.js"
exit /b %ERRORLEVEL%

:smoke
echo FALID smoke placeholder: running lightweight readiness checks.
node "%TOOLS%\browser-use-mcp-check.js"
node "%TOOLS%\check-cdp.js"
exit /b %ERRORLEVEL%

:session
echo FALID session check: Browser Use and CDP
node "%TOOLS%\browser-use-mcp-check.js"
node "%TOOLS%\check-cdp.js"
exit /b %ERRORLEVEL%

:releasecheck
echo FALID release-check placeholder
echo Use 02-brain/.opencode/prompts/release-decision.md with Engineer and the Decision Engine Rule.
exit /b 0
