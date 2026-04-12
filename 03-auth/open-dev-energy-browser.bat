@echo off
setlocal

set CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
set PROFILE_PATH=%~dp0chrome-profile
set DEBUG_PORT=9222

echo Opening Chrome with profile for PGN dev-energy...
start "" "%CHROME_PATH%" --remote-debugging-port=%DEBUG_PORT% --user-data-dir="%PROFILE_PATH%" "https://dev-energy.pgn.co.id"

echo.
echo Chrome opened with:
echo   - Profile: %PROFILE_PATH%
echo   - Debug port: %DEBUG_PORT%
echo.
echo Please LOGIN in the browser, then say 'done' here.
pause
