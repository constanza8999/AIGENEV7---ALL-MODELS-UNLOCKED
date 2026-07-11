@echo off
title AIGENEV7 AI Coding Agent
cd /d "%~dp0"

echo.
echo   █████╗ ██╗ ██████╗ ███████╗███╗   ██╗███████╗██╗   ██╗██╗  ██╗
echo  ██╔══██╗██║██╔════╝ ██╔════╝████╗  ██║██╔════╝██║   ██║██║  ██║
echo  ███████║██║██║  ███╗█████╗  ██╔██╗ ██║█████╗  ██║   ██║███████║
echo  ██╔══██║██║██║   ██║██╔══╝  ██║╚██╗██║██╔══╝  ╚██╗ ██╔╝██╔══██║
echo  ██║  ██║██║╚██████╔╝███████╗██║ ╚████║███████╗ ╚████╔╝ ██║  ██║
echo  ╚═╝  ╚═╝╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝╚══════╝  ╚═══╝  ╚═╝  ╚═╝
echo.
echo  AIGENEV7 AI Coding Agent v7.0.0
echo  Developed by CONSTANZA (Jose Jaime Julia)
echo  Unlimited . Uncensored . All Models
echo.

if "%1"=="" (
    echo Usage: start.bat "Your prompt" [--model ^<model-id^>] [--stream] [--no-stream]
    echo.
    echo Examples:
    echo   start.bat "Explain quantum computing"
    echo   start.bat "Write a Python script" --model fable-5
    echo   start.bat --list-models
    echo.
    echo Options:
    echo   --model, -m ^<id^>       Model ID (default: deepseek-v4-pro)
    echo   --stream / --no-stream   Enable/disable streaming
    echo   --list-models            List all available models
    echo.
    set /p prompt="Enter your prompt: "
    if not defined prompt exit /b
    echo.
    bun run inference.js %prompt%
) else (
    bun run inference.js %*
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [AIGENEV7] Error occurred. Check your API keys in .env file.
    echo [AIGENEV7] See .env.example for configuration instructions.
)

echo.
pause
