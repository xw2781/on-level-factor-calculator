@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
  echo Missing virtual environment at .venv\Scripts\python.exe
  echo Create it first, then install requirements.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" -c "import uvicorn" >nul 2>nul
if errorlevel 1 (
  echo Python dependencies are missing in .venv.
  echo Run: .venv\Scripts\python.exe -m pip install -r requirements.txt
  echo.
  pause
  exit /b 1
)

".venv\Scripts\python.exe" main.py --dev
set "exit_code=%errorlevel%"

if not "%exit_code%"=="0" (
  echo.
  echo Dev mode exited with code %exit_code%.
  pause
)

exit /b %exit_code%
