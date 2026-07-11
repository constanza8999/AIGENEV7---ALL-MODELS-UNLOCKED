@echo off
setlocal
title AIGENEV7 Package Builder

echo.
echo  AIGENEV7 - Creating deployment package...
echo.

rem Check if 7-Zip is installed
where 7z.exe 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 7-Zip not found - please install 7-Zip from https://7-zip.org
    pause
    exit /b 1
)

rem Create ZIP archive with all AIGENEV7 files
7z a -tzip AIGENEV7_v7.0.0.zip ^
  aigenev7.bat ^
  aigenev7-local.bat ^
  local-api-server.js ^
  inference.js ^
  inference-cli.js ^
  inference.json ^
  models.js ^
  start.bat ^
  bunconfig.js ^
  content-filter.conf ^
  .env.example ^
  README.md ^
  README.zip.md ^
  build_aigenev7_package.bat ^
  install_zip.bat ^
  icon.ico ^
  generate-icon.js ^
  convert-icon.js ^
  web\index.html ^
  web\icon.png ^
  web\favicon.ico ^
  web\icon-32.png ^
  web\icon-48.png ^
  web\icon-128.png

if %ERRORLEVEL% EQU 0 (
    echo.
    echo  ✓ AIGENEV7 v7.0.0 package created: AIGENEV7_v7.0.0.zip
    echo.
    echo  Included files:
    echo    - aigenev7.bat               (Main launcher)
    echo    - aigenev7-local.bat         (Local mode launcher — no login)
    echo    - local-api-server.js        (Local Codebuff API server)
    echo    - inference.js               (Multi-model inference engine)
    echo    - inference-cli.js           (Dedicated CLI entry point)
    echo    - inference.json             (Model configuration)
    echo    - models.js                  (Model catalog, 28 models)
    echo    - start.bat                  (Legacy launcher)
    echo    - build_aigenev7_package.bat (Full installer builder)
    echo    - install_zip.bat            (This ZIP builder)
    echo    - bunconfig.js               (Runtime config)
    echo    - content-filter.conf        (Uncensored settings)
    echo    - .env.example               (API key setup guide)
    echo    - README.md                  (Documentation)
    echo    - README.zip.md              (Package instructions)
    echo    - icon.ico                   (Application icon)
    echo    - generate-icon.js           (Icon generator)
    echo    - convert-icon.js            (Icon to PNG converter)
    echo    - web/index.html             (Web landing page)
    echo    - web/icon.png               (Page logo)
    echo    - web/favicon.ico            (Favicon)
    echo    - web/icon-32.png            (32px icon)
    echo    - web/icon-48.png            (48px icon)
    echo    - web/icon-128.png           (128px icon)
) else (
    echo.
    echo  ✗ Failed to create ZIP archive
)

pause
