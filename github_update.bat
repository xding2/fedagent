@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo   ============================================
echo   FedAgent - Git Push to GitHub
echo   ============================================
echo.

:: Check git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git not found. Please install Git first.
    pause
    exit /b 1
)

:: Init git if needed
if not exist ".git" (
    echo [1] Initializing git repository...
    git init
    git remote add origin https://github.com/xding2/fedagent.git
    echo   -^> Done
) else (
    echo [1] Git repository found.
)

:: Show status
echo.
echo [2] Checking files...
echo.
git status --short
echo.

:: Stage all files
echo [3] Staging files...
git add .
echo   -^> Done

:: Check if there are changes to commit
git diff --cached --quiet 2>nul
if not errorlevel 1 (
    echo.
    echo   Nothing to commit. Already up to date.
    pause
    exit /b 0
)

:: Get commit message
echo.
set /p "MSG=  Commit message [update]: "
if "!MSG!"=="" set "MSG=update"

:: Commit
echo.
echo [4] Committing...
git commit -m "!MSG!"
echo   -^> Done

:: Push
echo.
echo [5] Pushing to GitHub...
git push -u origin main
echo.

if errorlevel 1 (
    echo [!] Push failed. Trying to pull first...
    git pull origin main --allow-unrelated-histories
    git push -u origin main
)

echo.
echo   ============================================
echo   Done! Check: https://github.com/xding2/fedagent
echo   ============================================
echo.
pause
