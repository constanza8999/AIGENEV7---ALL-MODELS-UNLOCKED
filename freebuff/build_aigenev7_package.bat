@echo off
setlocal enabledelayedexpansion
title AIGENEV7 Package Builder

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║       AIGENEV7 v7.0.0 — Windows Installer Builder      ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo  This script builds the AIGENEV7 binary and packages it
echo  with the inference engine into a single distributed package.
echo.

rem ── Configuration ──
set "REPO_ROOT=%~dp0.."
set "PACKAGE_ROOT=%~dp0package"
set "PACKAGE_DIR=%PACKAGE_ROOT%\aigenev7-v7.0.0"
set "BINARY_SRC=%REPO_ROOT%\cli\bin\freebuff.exe"
set "BINARY_DST=%PACKAGE_DIR%\aigenev7.exe"
set "WASM_SRC=%REPO_ROOT%\cli\bin\tree-sitter.wasm"
set "WASM_DST=%PACKAGE_DIR%\tree-sitter.wasm"
set "BUILD_SCRIPT=%REPO_ROOT%\freeai\cli\build.ts"

rem ── Step 1: Build the binary ──
echo  [1/4] Building AIGENEV7 binary...
echo.

if exist "%BINARY_SRC%" (
    echo    ✓ Binary already built at %BINARY_SRC%
    echo    ℹ  Delete cli/bin/freebuff.exe to force a rebuild.
) else (
    echo    Building AIGENEV7 from source...
    cd /d "%REPO_ROOT%"
    bun run build:aigenev7
    if !ERRORLEVEL! NEQ 0 (
        echo.
        echo    ✗ Build failed. Make sure Bun is installed.
        echo    ℹ  Get Bun: https://bun.sh
        pause
        exit /b 1
    )
    echo.
    echo    ✓ Build complete!
)

rem ── Step 2: Create package directory ──
echo  [2/4] Creating package structure...
echo.

if exist "%PACKAGE_DIR%" (
    rmdir /s /q "%PACKAGE_DIR%" 2>nul
)

mkdir "%PACKAGE_DIR%" 2>nul
mkdir "%PACKAGE_DIR%\web" 2>nul

echo    ✓ Created %PACKAGE_DIR%

rem ── Step 3: Copy files ──
echo  [3/4] Copying files...
echo.

rem Copy the binary
if exist "%BINARY_SRC%" (
    copy /Y "%BINARY_SRC%" "%BINARY_DST%" >nul
    echo    ✓ aigenev7.exe  (binary)
) else (
    echo    ✗ Binary not found at %BINARY_SRC%
    echo    ℹ  Build the binary first: bun run build:aigenev7
    pause
    exit /b 1
)

rem Copy tree-sitter.wasm (needed by the binary at startup)
if exist "%WASM_SRC%" (
    copy /Y "%WASM_SRC%" "%WASM_DST%" >nul
    echo    ✓ tree-sitter.wasm  (language parser)
)

rem Copy inference engine files
copy /Y "%~dp0aigenev7.bat" "%PACKAGE_DIR%\aigenev7.bat" >nul
echo    ✓ aigenev7.bat  (launcher)

copy /Y "%~dp0aigenev7-local.bat" "%PACKAGE_DIR%\aigenev7-local.bat" >nul
echo    ✓ aigenev7-local.bat  (local mode launcher — no login)

copy /Y "%~dp0local-api-server.js" "%PACKAGE_DIR%\local-api-server.js" >nul
echo    ✓ local-api-server.js  (local Codebuff API server)

copy /Y "%~dp0aigenev7-local.bat" "%PACKAGE_DIR%\aigenev7-local.bat" >nul
echo    ✓ aigenev7-local.bat  (local mode launcher — no login)

copy /Y "%~dp0aigenev7.bat" "%PACKAGE_DIR%\aigenev7.bat" >nul
echo    ✓ aigenev7.bat  (launcher)

copy /Y "%~dp0inference.js" "%PACKAGE_DIR%\inference.js" >nul
echo    ✓ inference.js  (multi-model engine)

copy /Y "%~dp0inference-cli.js" "%PACKAGE_DIR%\inference-cli.js" >nul
echo    ✓ inference-cli.js  (CLI tools)

copy /Y "%~dp0inference.json" "%PACKAGE_DIR%\inference.json" >nul
echo    ✓ inference.json  (model config)

copy /Y "%~dp0models.js" "%PACKAGE_DIR%\models.js" >nul
echo    ✓ models.js  (model catalog)

copy /Y "%~dp0bunconfig.js" "%PACKAGE_DIR%\bunconfig.js" >nul
echo    ✓ bunconfig.js  (runtime config)

copy /Y "%~dp0content-filter.conf" "%PACKAGE_DIR%\content-filter.conf" >nul
echo    ✓ content-filter.conf  (uncensored mode)

copy /Y "%~dp0icon.ico" "%PACKAGE_DIR%\icon.ico" >nul
echo    ✓ icon.ico  (application icon)

copy /Y "%~dp0generate-icon.js" "%PACKAGE_DIR%\generate-icon.js" >nul
echo    ✓ generate-icon.js  (icon generator)

copy /Y "%~dp0convert-icon.js" "%PACKAGE_DIR%\convert-icon.js" >nul
echo    ✓ convert-icon.js  (icon to PNG converter)

copy /Y "%~dp0web\icon.png" "%PACKAGE_DIR%\web\icon.png" >nul
echo    ✓ web\icon.png  (page logo)

copy /Y "%~dp0web\favicon.ico" "%PACKAGE_DIR%\web\favicon.ico" >nul
echo    ✓ web\favicon.ico  (favicon)

copy /Y "%~dp0web\icon-32.png" "%PACKAGE_DIR%\web\icon-32.png" >nul
echo    ✓ web\icon-32.png  (32px icon)

copy /Y "%~dp0web\icon-48.png" "%PACKAGE_DIR%\web\icon-48.png" >nul
echo    ✓ web\icon-48.png  (48px icon)

copy /Y "%~dp0web\icon-128.png" "%PACKAGE_DIR%\web\icon-128.png" >nul
echo    ✓ web\icon-128.png  (128px icon)

copy /Y "%~dp0.env.example" "%PACKAGE_DIR%\.env.example" >nul
echo    ✓ .env.example  (API key guide)

copy /Y "%~dp0README.md" "%PACKAGE_DIR%\README.md" >nul
echo    ✓ README.md  (documentation)

copy /Y "%~dp0web\index.html" "%PACKAGE_DIR%\web\index.html" >nul
echo    ✓ web\index.html  (landing page)

rem Create empty .env for user to fill in
if not exist "%PACKAGE_DIR%\.env" (
    copy "%~dp0.env.example" "%PACKAGE_DIR%\.env" >nul 2>nul
)

rem ── Step 4: Show summary ──
echo  [4/4] Finalizing...
echo.

rem Calculate total size
set "TOTAL_SIZE=0"
for /f "tokens=*" %%F in ('dir /s /a-d /-c "%PACKAGE_DIR%" 2^>nul ^| find "File(s)"') do (
    for %%S in (%%F) do set "TOTAL_SIZE=%%S"
)

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║               Package Built Successfully!               ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
echo    Location: %PACKAGE_DIR%
echo    Size:     %TOTAL_SIZE% bytes
echo.
echo    Included:
echo      • aigenev7.exe          (standalone binary — 119 MB)
echo      • aigenev7.bat          (Windows launcher)
echo      • inference.js          (multi-model inference engine)
echo      • inference-cli.js      (CLI tools: chat, serve, models)
echo      • models.js             (28 models, 10 providers)
echo      • inference.json         (unlimited, uncensored config)
echo      • tree-sitter.wasm      (language parser)
echo      • .env.example          (API key setup guide)
echo      • README.md             (documentation)
echo.
echo  ── Quick Start ──
echo.
echo  1. Navigate to the package:
echo     cd %PACKAGE_DIR%
echo.
echo  2. Set your API key in .env
echo     (copy from .env.example and add your key)
echo.
echo  3. Run the agent:
echo     aigenev7 "Your prompt here"
echo.
echo  4. Or use the inference engine directly:
echo     bun inference.js "Your prompt" --list-models
echo.
echo  5. Or start the web interface:
echo     bun inference-cli.js serve --port 3456
echo.

rem ── Offer to create a ZIP ──
set "CREATE_ZIP="
set /p "CREATE_ZIP=Create ZIP archive? (Y/n): "
if /i "!CREATE_ZIP!"=="" set "CREATE_ZIP=Y"
if /i "!CREATE_ZIP!"=="Y" (
    echo.
    echo  Creating AIGENEV7_v7.0.0.zip...
    
    rem Check if 7-Zip is available
    where 7z.exe >nul 2>nul
    if !ERRORLEVEL! EQU 0 (
        cd /d "%PACKAGE_ROOT%"
        7z a -tzip "AIGENEV7_v7.0.0.zip" "aigenev7-v7.0.0" >nul
        echo  ✓ Created: %PACKAGE_ROOT%\AIGENEV7_v7.0.0.zip
    ) else (
        rem Fallback: use PowerShell to create ZIP
        powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::CreateFromDirectory('%PACKAGE_DIR%', '%PACKAGE_ROOT%\AIGENEV7_v7.0.0.zip')" >nul 2>&1
        if exist "%PACKAGE_ROOT%\AIGENEV7_v7.0.0.zip" (
            echo  ✓ Created: %PACKAGE_ROOT%\AIGENEV7_v7.0.0.zip
        ) else (
            echo  ⚠ Could not create ZIP. Package folder is at:
            echo    %PACKAGE_DIR%
        )
    )
)

echo.
echo  ✓ AIGENEV7 v7.0.0 package is ready!
echo.
pause
