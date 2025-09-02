@echo off
setlocal EnableDelayedExpansion

echo Starting ModMii Runner setup...

REM Change to the runner directory (assuming we're already in it)
cd /d "%~dp0"

set MODMII_VERSION=8.0.4

REM Download and extract ModMii if not already present or version mismatch
set DOWNLOAD_NEEDED=0
if not exist "modmii" (
    set DOWNLOAD_NEEDED=1
) else (
    if not exist "modmii\VERSION.txt" (
        set DOWNLOAD_NEEDED=1
    ) else (
        set /p CURRENT_VERSION=<modmii\VERSION.txt
        if not "!CURRENT_VERSION!"=="%MODMII_VERSION%" (
            set DOWNLOAD_NEEDED=1
        )
    )
)

if %DOWNLOAD_NEEDED%==1 (
    echo Downloading ModMii release...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/modmii/modmii.github.io/releases/download/%MODMII_VERSION%/ModMii.zip' -OutFile 'ModMii.zip'"
    echo Extracting ModMii...
    if exist "modmii" rmdir /s /q "modmii"
    powershell -Command "Expand-Archive -Path 'ModMii.zip' -DestinationPath './modmii'"
    del ModMii.zip
    echo %MODMII_VERSION% > modmii\VERSION.txt
    echo ModMii extracted successfully
) else (
    echo ModMii already exists with correct version, skipping download
)

REM Ensure Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Python not found. Please install Python 3.11 or later.
    exit /b 1
)

REM Upgrade pip and install requirements
echo Installing Python dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo Setup complete. Starting Flask app in production mode...

REM Run Flask app with Gunicorn for production
gunicorn --bind 0.0.0.0:4000 --workers 4 --worker-class sync --timeout 120 main:app
