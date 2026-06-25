@echo off
title Tindahan Helper - Sari-Sari Store POS
color 0E

echo.
echo ===============================================
echo      Tindahan Helper - Sari-Sari Store POS
echo ===============================================
echo.

:: Step 1: Kill any process already using port 5000
echo [!] Checking network port 5000...
echo.
powershell -Command "Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Write-Host '  [!] Stopping old server...'; Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>nul

:: Step 2: Build the frontend
echo [1/2] Building frontend components...
echo.
cd /d "%~dp0frontend"
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Frontend build failed. Installing dependencies...
    call npm install >nul 2>&1
    call npm run build
    if %errorlevel% neq 0 (
        echo [X] Build failed. Check for errors above.
        pause
        exit /b 1
    )
)
echo [OK] Frontend built successfully!
echo.

:: Step 3: Start the backend server
echo [2/2] Starting local store server...
echo.
echo [OK] Tindahan Helper is ready!
echo.

echo ===============================================
echo.
echo   Share Wi-Fi with your phone to sync stocks!
echo   Press [Ctrl+C] to stop the server.
echo.

cd /d "%~dp0backend"
node server.js
