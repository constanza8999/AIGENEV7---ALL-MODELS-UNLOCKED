@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ===========================================================================
:: AIGENEV7 Local Mode Launcher (Windows)
:: ===========================================================================
:: Starts the local API server and AIGENEV7 CLI together, no login required.
::
:: Usage:
::   aigenev7-local.bat                    - Interactive mode
::   aigenev7-local.bat "your prompt here" - Direct prompt mode
::   aigenev7-local.bat --help             - Show this help
:: ===========================================================================

title AIGENEV7 Local

:: ── Find the repo root ──────────────────────────────────────────────────
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_ROOT=%%~fI"

:: ── Default ports ───────────────────────────────────────────────────────
set "API_PORT=3457"

:: ── Parse args ──────────────────────────────────────────────────────────
set "PROMPT="
set "SHOW_HELP="
set "REST_ARGS="

:parse
if "%~1"=="" goto :end_parse
if /i "%~1"=="--help" set "SHOW_HELP=1" & goto :end_parse
if /i "%~1"=="-h" set "SHOW_HELP=1" & goto :end_parse
if /i "%~1"=="--port" set "API_PORT=%~2" & shift & shift & goto :parse
set "PROMPT=%*"
goto :end_parse
:end_parse

if defined SHOW_HELP (
    echo.
    echo  AIGENEV7 Local Mode - No Login Required
    echo.
    echo  Usage: aigenev7-local.bat [options] ["prompt"]
    echo.
    echo  Options:
    echo    --port ^<n^>    API server port (default: 3457)
    echo    --help, -h     Show this help
    echo.
    echo  Examples:
    echo    aigenev7-local.bat
    echo    aigenev7-local.bat "Write a Python web server"
    echo    aigenev7-local.bat --port 3458
    echo.
    pause
    exit /b 0
)

:: ── Check for Node.js / Bun ────────────────────────────────────────────
where bun >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo  ✗ Bun is not installed. Install it from https://bun.sh
    echo    Then run: curl -fsSL https://bun.sh/install ^| bash
    echo.
    pause
    exit /b 1
)

:: ── Make sure needed files exist ───────────────────────────────────────
if not exist "%SCRIPT_DIR%local-api-server.js" (
    echo.
    echo  ✗ local-api-server.js not found in %SCRIPT_DIR%
    echo    Make sure you're running from the AIGENEV7 package directory.
    echo.
    pause
    exit /b 1
)

:: ── Find the AIGENEV7 binary ───────────────────────────────────────────
set "BINARY="
if exist "%REPO_ROOT%\cli\bin\freebuff.exe" set "BINARY=%REPO_ROOT%\cli\bin\freebuff.exe"
if exist "%SCRIPT_DIR%aigenev7.exe" set "BINARY=%SCRIPT_DIR%aigenev7.exe"
if exist "%SCRIPT_DIR%freebuff.exe" set "BINARY=%SCRIPT_DIR%freebuff.exe"
if exist "%SCRIPT_DIR%..\cli\bin\aigenev7.exe" set "BINARY=%SCRIPT_DIR%..\cli\bin\aigenev7.exe"

:: ── Check .env for API keys ────────────────────────────────────────────
if exist "%SCRIPT_DIR%.env" (
    echo  ✓ Found API keys: %SCRIPT_DIR%.env
) else if exist "%SCRIPT_DIR%.env.example" (
    echo  ⚠  No .env file found. Copying .env.example...
    copy "%SCRIPT_DIR%.env.example" "%SCRIPT_DIR%.env" >nul
    echo  ✓ Created %SCRIPT_DIR%.env
    echo    Edit it to add your API keys, then re-run this script.
    echo.
    echo    Example: set NVIDIA_API_KEY=nvapi-your-key-here
    echo.
    pause
    exit /b 0
) else (
    echo  ⚠  No API keys configured. Create a freebuff\.env file with:
    echo    NVIDIA_API_KEY=your-key-here
    echo    DEEPSEEK_API_KEY=your-key-here
    echo.
    pause
    exit /b 0
)

:: ── Load the default model from .env ───────────────────────────────────
:: (will be read by local-api-server.js)

:: ── Read AI Gen 7 EV Default Model from env ─────────────────────────────
if not defined AIGENEV7_DEFAULT_MODEL set "AIGENEV7_DEFAULT_MODEL=nvidia-llama-3.1-8b"

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║         AIGENEV7 - Local Mode                           ║
echo  ║         No login required. Use your own API keys.       ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  Starting API server on port %API_PORT%...
echo.

:: ── Start the local API server in background ───────────────────────────
start "AIGENEV7-API" /B /MIN bun "%SCRIPT_DIR%local-api-server.js" --port %API_PORT%

:: ── Wait for the server to be ready ────────────────────────────────────
echo  Waiting for API server...
set /a "MAX_WAIT=15"
set /a "WAIT_COUNT=0"

:wait_loop
timeout /t 1 /nobreak >nul
set /a "WAIT_COUNT+=1"

:: Check if the server is responding
2>nul (
    >nul (
        :: Try to connect to the health endpoint
        curl -s http://localhost:%API_PORT%/health >nul
    )
)
if %ERRORLEVEL% equ 0 (
    echo  ✓ API server is ready!
    goto :server_ready
)

if %WAIT_COUNT% geq %MAX_WAIT% (
    echo.
    echo  ✗ Timed out waiting for API server to start.
    echo    Check if port %API_PORT% is available.
    echo.
    :: Kill the background server
    taskkill /f /im "bun.exe" /fi "WINDOWTITLE eq AIGENEV7-API" >nul 2>nul
    pause
    exit /b 1
)
goto :wait_loop

:server_ready

:: ── Run the AIGENEV7 CLI ────────────────────────────────────────────────
echo.
echo  Launching AIGENEV7...
echo.

if defined BINARY (
    if defined PROMPT (
        set "AIGENEV7_LOCAL=true"
        set "CODEBUFF_API_KEY=local-dev-key"
        set "CODEBUFF_APP_URL=http://localhost:%API_PORT%"
        "%BINARY%" %PROMPT%
    ) else (
        set "AIGENEV7_LOCAL=true"
        set "CODEBUFF_API_KEY=local-dev-key"
        set "CODEBUFF_APP_URL=http://localhost:%API_PORT%"
        "%BINARY%"
    )
) else (
    echo  ⚠  AIGENEV7 binary not found. Using inference.js directly.
    echo.
    if defined PROMPT (
        bun "%SCRIPT_DIR%inference-cli.js" %PROMPT%
    ) else (
        bun "%SCRIPT_DIR%inference-cli.js" chat
    )
)

:: ── Cleanup: stop the API server ───────────────────────────────────────
echo.
echo  Shutting down API server...
taskkill /f /im "bun.exe" /fi "WINDOWTITLE eq AIGENEV7-API" >nul 2>nul
echo  ✓ Done.

exit /b %ERRORLEVEL%
