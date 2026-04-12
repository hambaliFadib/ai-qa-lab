@echo off
setlocal

for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"

set "PROJECT_TEMP=%ROOT%\01-runtime\temp"
set "OPENCODE_RUNTIME_ROOT=%PROJECT_TEMP%\opencode-xdg"
set "XDG_CONFIG_HOME=%OPENCODE_RUNTIME_ROOT%\config"
set "XDG_DATA_HOME=%OPENCODE_RUNTIME_ROOT%\data"
set "XDG_STATE_HOME=%OPENCODE_RUNTIME_ROOT%\state"
set "XDG_CACHE_HOME=%OPENCODE_RUNTIME_ROOT%\cache"
set "TMP=%PROJECT_TEMP%"
set "TEMP=%PROJECT_TEMP%"

if not exist "%PROJECT_TEMP%" mkdir "%PROJECT_TEMP%" 2>nul
if not exist "%OPENCODE_RUNTIME_ROOT%" mkdir "%OPENCODE_RUNTIME_ROOT%" 2>nul
if not exist "%XDG_CONFIG_HOME%" mkdir "%XDG_CONFIG_HOME%" 2>nul
if not exist "%XDG_DATA_HOME%" mkdir "%XDG_DATA_HOME%" 2>nul
if not exist "%XDG_STATE_HOME%" mkdir "%XDG_STATE_HOME%" 2>nul
if not exist "%XDG_CACHE_HOME%" mkdir "%XDG_CACHE_HOME%" 2>nul

set "OPENCODE_BIN="

where opencode.cmd >nul 2>nul
if not errorlevel 1 set "OPENCODE_BIN=opencode.cmd"
if not defined OPENCODE_BIN if exist "%APPDATA%\npm\opencode.cmd" set "OPENCODE_BIN=%APPDATA%\npm\opencode.cmd"
if not defined OPENCODE_BIN if exist "%USERPROFILE%\AppData\Roaming\npm\opencode.cmd" set "OPENCODE_BIN=%USERPROFILE%\AppData\Roaming\npm\opencode.cmd"

if not defined OPENCODE_BIN (
  echo opencode.cmd was not found in PATH.
  exit /b 1
)

call "%OPENCODE_BIN%" %*
exit /b %ERRORLEVEL%
