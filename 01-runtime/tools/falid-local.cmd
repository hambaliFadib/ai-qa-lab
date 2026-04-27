@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"

if /I "%~1"=="mcp" (
  set "AI_QA_AUTOSTART_LITELLM=false"
)

call "%ROOT%\01-runtime\tools\opencode-local.cmd" %*
exit /b %ERRORLEVEL%
