@echo off
echo ===============================================
echo      Tindahan Helper - First Time Setup
echo ===============================================
echo.

echo [1/2] Installing backend dependencies...
echo.
cd /d "%~dp0backend"
call npm install
if %errorlevel% neq 0 (
    echo [X] Backend installation failed.
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed successfully!
echo.

echo [2/2] Installing frontend dependencies...
echo.
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo [X] Frontend installation failed.
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed successfully!
echo.

echo ===============================================
echo.
echo   Setup Complete! You are ready to go.
echo   You can now double-click start.bat to run the app.
echo.
pause
