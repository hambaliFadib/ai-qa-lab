@echo off
setlocal

REM =========================================================
REM AI-QA-LAB CURRENT STRUCTURE BOOTSTRAP
REM Root:
REM D:\AI-QA-LAB
REM =========================================================

set "ROOT=D:\AI-QA-LAB"

echo ======================================
echo Ensuring AI-QA-LAB current structure...
echo Root: %ROOT%
echo ======================================
echo.

if not exist "%ROOT%" (
    mkdir "%ROOT%" 2>nul
)

for %%D in (
    "01-runtime"
    "02-brain"
    "03-auth"
    "04-knowledge-raw"
    "05-observability"
    "06-testing"
    "99-archive"
) do (
    if not exist "%ROOT%\%%~D" mkdir "%ROOT%\%%~D" 2>nul
)

for %%D in (
    "01-runtime\artifacts\adhoc-notes"
    "01-runtime\artifacts\console-logs"
    "01-runtime\artifacts\manual-flow-records"
    "01-runtime\artifacts\network"
    "01-runtime\artifacts\screenshots"
    "01-runtime\artifacts\traces"
    "01-runtime\artifacts\videos"
    "01-runtime\runtime\access"
    "01-runtime\runtime\capture"
    "01-runtime\runtime\docs"
    "01-runtime\runtime\modules"
    "01-runtime\runtime\session"
    "01-runtime\runtime\shell"
    "01-runtime\temp\opencode-xdg\cache"
    "01-runtime\temp\opencode-xdg\config"
    "01-runtime\temp\opencode-xdg\data"
    "01-runtime\temp\opencode-xdg\state"
    "02-brain\distilled-output\global"
    "02-brain\distilled-output\per-module"
    "02-brain\learning-ledger\blocks"
    "02-brain\learning-ledger\index"
    "02-brain\learning-ledger\manifests"
    "02-brain\learning-ledger\snapshots"
    "03-auth\chrome-profile"
    "03-auth\notes"
    "03-auth\screenshots"
    "03-auth\state"
    "03-auth\user-data"
    "04-knowledge-raw\APP_TESTING_STANDARDS"
    "04-knowledge-raw\BPMN_BISPRO"
    "04-knowledge-raw\MOM"
    "04-knowledge-raw\QA_STANDARDS\API"
    "04-knowledge-raw\QA_STANDARDS\AUTOMATION"
    "04-knowledge-raw\QA_STANDARDS\TEST_DATA"
    "04-knowledge-raw\QA_STANDARDS\UI"
    "05-observability\opencode-storage"
    "06-testing\adhoc"
    "06-testing\exploratory"
    "06-testing\smoke"
    "06-testing\uat-draft"
    "99-archive\assistant-temp"
) do (
    if not exist "%ROOT%\%%~D" mkdir "%ROOT%\%%~D" 2>nul
)

if exist "%ROOT%\02-brain\.opencode" (
    if not exist "%ROOT%\.opencode" (
        mklink /J "%ROOT%\.opencode" "%ROOT%\02-brain\.opencode" >nul
    )
)

echo.
echo ======================================
echo AI-QA-LAB structure is ready.
echo ======================================
echo.
endlocal
