@echo off
REM Build script for Windows EXE
REM Usage: build_windows.bat

echo.
echo ========================================
echo Alice AI Ultra Pet - Windows Build
echo ========================================
echo.

REM Check if PyInstaller is installed
python -m pip show pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing PyInstaller...
    python -m pip install -q pyinstaller
)

REM Build the executable
echo Building executable...
pyinstaller alice_pet.spec --noconfirm --clean

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo ✓ Build successful!
    echo ========================================
    echo.
    echo Executable location: dist\AliceAIPet.exe
    echo.
) else (
    echo.
    echo ========================================
    echo ✗ Build failed!
    echo ========================================
    pause
    exit /b 1
)

pause
