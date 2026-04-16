@echo off
setlocal

cd /d "%~dp0"

where git >nul 2>nul
if errorlevel 1 (
  echo Git is not available on PATH.
  pause
  exit /b 1
)

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo This folder is not a git repository.
  pause
  exit /b 1
)

git status --porcelain | findstr . >nul
if errorlevel 1 (
  echo No changes to commit.
  pause
  exit /b 0
)

for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%i"

set "COMMIT_MESSAGE=%~1"
if not defined COMMIT_MESSAGE (
  set /p COMMIT_MESSAGE=Commit message: 
)

if not defined COMMIT_MESSAGE (
  echo Commit message is required.
  pause
  exit /b 1
)

echo.
echo Staging changes...
git add -A
if errorlevel 1 (
  echo Failed to stage changes.
  pause
  exit /b 1
)

echo.
echo Creating commit on branch %BRANCH%...
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 (
  echo Commit failed.
  pause
  exit /b 1
)

echo.
echo Pushing to origin/%BRANCH%...
git push origin "%BRANCH%"
if errorlevel 1 (
  echo Push failed.
  pause
  exit /b 1
)

echo.
echo Commit and push completed successfully.
pause
exit /b 0
