@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo   ============================================
echo        F E D A G E N T
echo   ============================================
echo   Separation of Powers Multi-Agent System
echo.

:: ---------- Check Python ----------
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo [OK] %%i

:: ---------- Check Node.js ----------
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>^&1') do echo [OK] Node.js %%i

:: ---------- Install Python deps ----------
echo.
echo [1/4] Installing Python dependencies...
set PYTHONUTF8=1
pip install -q fastapi uvicorn sqlalchemy aiosqlite pyyaml httpx openai 2>nul
echo   -^> Done

:: ---------- Install frontend deps ----------
echo [2/4] Installing frontend dependencies...
if not exist "frontend\node_modules" (
    cd frontend
    call npm install --silent 2>nul
    cd ..
    echo   -^> Done
) else (
    echo   -^> Already installed, skip
)

:: ---------- Build frontend ----------
echo [3/4] Building frontend...
if not exist "frontend\dist\index.html" (
    cd frontend
    call npx vite build --logLevel error 2>nul
    cd ..
    echo   -^> Done
) else (
    echo   -^> Already built, skip
)

:: ---------- Check config ----------
echo [4/4] Checking config...
if exist "config.yaml" goto :config_done

echo.
echo   First run - configure your LLM provider:
echo.
echo     1) OpenAI
echo     2) DeepSeek
echo     3) SiliconFlow
echo     4) OpenRouter
echo     5) Anthropic (Claude)
echo     6) Ollama (local)
echo     7) Other OpenAI-compatible API
echo.
set /p "CHOICE=  Enter number [1-7]: "

if "!CHOICE!"=="1" goto :provider_1
if "!CHOICE!"=="2" goto :provider_2
if "!CHOICE!"=="3" goto :provider_3
if "!CHOICE!"=="4" goto :provider_4
if "!CHOICE!"=="5" goto :provider_5
if "!CHOICE!"=="6" goto :provider_6
if "!CHOICE!"=="7" goto :provider_7
goto :provider_1

:provider_1
set "PROVIDER=openai"
set "BASE_URL="
set "DEFAULT_BIG=gpt-4o"
set "DEFAULT_SMALL=gpt-4o-mini"
set "ENV_NAME=OPENAI_API_KEY"
goto :provider_done

:provider_2
set "PROVIDER=openai"
set "BASE_URL=https://api.deepseek.com/v1"
set "DEFAULT_BIG=deepseek-chat"
set "DEFAULT_SMALL=deepseek-chat"
set "ENV_NAME=DEEPSEEK_API_KEY"
goto :provider_done

:provider_3
set "PROVIDER=openai"
set "BASE_URL=https://api.siliconflow.cn/v1"
set "DEFAULT_BIG=Qwen/Qwen2.5-72B-Instruct"
set "DEFAULT_SMALL=Qwen/Qwen2.5-7B-Instruct"
set "ENV_NAME=SILICONFLOW_API_KEY"
goto :provider_done

:provider_4
set "PROVIDER=openai"
set "BASE_URL=https://openrouter.ai/api/v1"
set "DEFAULT_BIG=anthropic/claude-sonnet-4"
set "DEFAULT_SMALL=anthropic/claude-haiku-4"
set "ENV_NAME=OPENROUTER_API_KEY"
goto :provider_done

:provider_5
set "PROVIDER=anthropic"
set "BASE_URL="
set "DEFAULT_BIG=claude-sonnet-4-20250514"
set "DEFAULT_SMALL=claude-haiku-4-5-20251001"
set "ENV_NAME=ANTHROPIC_API_KEY"
goto :provider_done

:provider_6
set "PROVIDER=ollama"
set "BASE_URL=http://localhost:11434"
set "DEFAULT_BIG=llama3:70b"
set "DEFAULT_SMALL=llama3:8b"
set "ENV_NAME="
goto :provider_done

:provider_7
set "PROVIDER=openai"
set /p "BASE_URL=  Enter API Base URL: "
set "DEFAULT_BIG="
set "DEFAULT_SMALL="
set "ENV_NAME=FEDAGENT_API_KEY"
goto :provider_done

:provider_done

:: Get API Key
set "API_KEY="
if not "!PROVIDER!"=="ollama" (
    echo.
    set /p "API_KEY=  Enter API Key: "
)

:: Model names
echo.
set /p "BIG_MODEL=  Large model [!DEFAULT_BIG!]: "
if "!BIG_MODEL!"=="" set "BIG_MODEL=!DEFAULT_BIG!"
set /p "SMALL_MODEL=  Small model [!DEFAULT_SMALL!]: "
if "!SMALL_MODEL!"=="" set "SMALL_MODEL=!DEFAULT_SMALL!"

:: Write config file (no plaintext key)
if "!ENV_NAME!"=="" set "ENV_NAME=FEDAGENT_API_KEY"
(
    echo # FedAgent Config
    echo # API Key loaded from .env file via environment variable
    echo.
    echo provider: !PROVIDER!
) > config.yaml

if not "!BASE_URL!"=="" (
    echo base_url: !BASE_URL!>> config.yaml
)

echo api_key: ${!ENV_NAME!}>> config.yaml

(
    echo.
    echo large_model: !BIG_MODEL!
    echo small_model: !SMALL_MODEL!
) >> config.yaml

echo.
echo   -^> Config saved to config.yaml

:: Save key to .env (excluded by .gitignore)
if not "!API_KEY!"=="" (
    echo !ENV_NAME!=!API_KEY!> .env
    echo   -^> API Key saved to .env
)

:config_done

:: ---------- Load .env ----------
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)

echo.
echo ============================================
echo   Starting FedAgent server...
echo   URL: http://localhost:8000
echo   Press Ctrl+C to stop
echo ============================================
echo.

:: ---------- Start server ----------
set PYTHONUTF8=1
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
