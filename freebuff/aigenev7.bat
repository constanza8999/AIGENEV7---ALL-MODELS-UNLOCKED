@echo off
title AIGENEV7 AI Coding Agent
setlocal enabledelayedexpansion

cd /d "%~dp0"

rem ── Detect binary location ──
set "BINARY="
if exist "%~dp0aigenev7.exe" set "BINARY=%~dp0aigenev7.exe"
if exist "%~dp0..\cli\bin\freebuff.exe" set "BINARY=%~dp0..\cli\bin\freebuff.exe"
if exist "%~dp0..\aigenev7\dist\aigenev7.exe" set "BINARY=%~dp0..\aigenev7\dist\aigenev7.exe"
if exist "%~dp0bin\aigenev7.exe" set "BINARY=%~dp0bin\aigenev7.exe"

rem ── Display header ──
echo.
echo   █████╗ ██╗ ██████╗ ███████╗███╗   ██╗███████╗██╗   ██╗██╗  ██╗
echo  ██╔══██╗██║██╔════╝ ██╔════╝████╗  ██║██╔════╝██║   ██║██║  ██║
echo  ███████║██║██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██║   ██║███████║
echo  ██╔══██║██║██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚██╗ ██╔╝██╔══██║
echo  ██║  ██║██║╚██████╔╝███████╗██║ ╚████║███████╗ ╚████╔╝ ██║  ██║
echo  ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝
echo.
echo  AIGENEV7 v7.0.0 — Free AI Coding Agent
echo  Unlimited . Uncensored . All Models
echo  Developed by CONSTANZA (Jose Jaime Julia)
echo.

rem ── Check for flags ──
set "SHOW_HELP="
set "SHOW_VERSION="
set "LIST_MODELS="
for %%A in (%*) do (
    if "%%A"=="--help" set "SHOW_HELP=1"
    if "%%A"=="-h" set "SHOW_HELP=1"
    if "%%A"=="--version" set "SHOW_VERSION=1"
    if "%%A"=="-v" set "SHOW_VERSION=1"
    if "%%A"=="--list-models" set "LIST_MODELS=1"
    if "%%A"=="--models" set "LIST_MODELS=1"
)

rem ── Handle --version ──
if defined SHOW_VERSION (
    if defined BINARY (
        "%BINARY%" --version
    ) else (
        echo AIGENEV7 v7.0.0
    )
    goto :EOF
)

rem ── Handle --list-models (try binary first, then inference.js) ──
if defined LIST_MODELS (
    if defined BINARY (
        "%BINARY%" --list-models 2>nul
        if !ERRORLEVEL! EQU 0 goto :EOF
    )
    if exist "%~dp0inference.js" (
        bun run inference.js --list-models
        if !ERRORLEVEL! NEQ 0 (
            echo [AIGENEV7] Please install Bun from https://bun.sh to use the inference engine.
        )
    ) else (
        echo [AIGENEV7] Model list unavailable. inference.js not found.
    )
    goto :EOF
)

rem ── Handle --help ──
if defined SHOW_HELP (
    if defined BINARY (
        "%BINARY%" --help
    ) else (
        call :showHelp
    )
    goto :EOF
)

rem ── Run binary if found ──
if defined BINARY (
    "%BINARY%" %*
    set "EXIT_CODE=!ERRORLEVEL!"
    if !EXIT_CODE! NEQ 0 (
        echo.
        echo [AIGENEV7] Binary exited with code !EXIT_CODE!
    )
    goto :EOF
)

rem ── Fallback: use inference.js directly ──
if exist "%~dp0inference.js" (
    if "%*"=="" (
        call :showHelp
        echo.
        set /p "userPrompt=  Enter your prompt: "
        if defined userPrompt (
            echo.
            bun run inference.js !userPrompt!
        )
    ) else (
        bun run inference.js %*
    )
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo [AIGENEV7] Error occurred. Check your API keys in .env file.
        echo [AIGENEV7] See .env.example for configuration instructions.
    )
    echo.
    pause
    goto :EOF
)

rem ── Nothing found ──
echo [AIGENEV7] Error: No AIGENEV7 binary or inference engine found.
echo [AIGENEV7] Please reinstall the package or check the installation.
pause
goto :EOF

rem ── Help display ──
:showHelp
echo  Usage: aigenev7 "Your prompt" [options]
echo  Usage: aigenev7 [command]
echo.
echo  Commands:
echo    "Your prompt"          Run a one-shot inference
echo    --help, -h             Show this help message
echo    --version, -v          Show version information
echo    --list-models          List all available models
echo    --model ^<id^>, -m ^<id^>  Specify a model to use
echo.
echo  Examples:
echo    aigenev7 "Explain quantum computing"
echo    aigenev7 "Write a Python script" --model fable-5
echo    aigenev7 --list-models
echo    aigenev7 --version
echo.
echo  Requirements:
echo    - AIGENEV7 binary in the same directory, OR
echo    - Bun runtime + inference.js (install Bun from https://bun.sh)
echo    - At least one API key in .env
goto :EOF
