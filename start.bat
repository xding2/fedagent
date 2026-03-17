@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo.
echo   ███████╗███████╗██████╗  █████╗  ██████╗ ███████╗███╗   ██╗████████╗
echo   ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
echo   █████╗  █████╗  ██║  ██║███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
echo   ██╔══╝  ██╔══╝  ██║  ██║██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
echo   ██║     ███████╗██████╔╝██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
echo   ╚═╝     ╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝
echo.
echo   三权分立多 Agent 协作系统
echo   ============================================
echo.

:: ---------- 检查 Python ----------
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未找到 Python，请先安装 Python 3.10+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo [OK] %%i

:: ---------- 检查 Node.js ----------
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 未找到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version 2^>^&1') do echo [OK] Node.js %%i

:: ---------- 安装 Python 依赖 ----------
echo.
echo [1/4] 安装 Python 依赖...
set PYTHONUTF8=1
pip install -q fastapi uvicorn sqlalchemy aiosqlite pyyaml httpx openai 2>nul
echo   -^> 完成

:: ---------- 安装前端依赖 ----------
echo [2/4] 安装前端依赖...
if not exist "frontend\node_modules" (
    cd frontend
    call npm install --silent 2>nul
    cd ..
    echo   -^> 完成
) else (
    echo   -^> 已存在，跳过
)

:: ---------- 构建前端 ----------
echo [3/4] 构建前端...
if not exist "frontend\dist\index.html" (
    cd frontend
    call npx vite build --logLevel error 2>nul
    cd ..
    echo   -^> 完成
) else (
    echo   -^> 已是最新，跳过
)

:: ---------- 检查配置 ----------
echo [4/4] 检查配置...
if not exist "config.yaml" (
    echo.
    echo   首次运行，需要配置 API 信息。
    echo   请选择你的 LLM 提供商:
    echo.
    echo     1^) OpenAI (官方)
    echo     2^) DeepSeek
    echo     3^) SiliconFlow (硅基流动)
    echo     4^) OpenRouter
    echo     5^) Anthropic (Claude)
    echo     6^) Ollama (本地模型)
    echo     7^) 其他 OpenAI 兼容 API
    echo.
    set /p "CHOICE=  请输入编号 [1-7]: "

    if "!CHOICE!"=="1" (
        set "PROVIDER=openai"
        set "BASE_URL="
        set "DEFAULT_BIG=gpt-4o"
        set "DEFAULT_SMALL=gpt-4o-mini"
        set "ENV_NAME=OPENAI_API_KEY"
    ) else if "!CHOICE!"=="2" (
        set "PROVIDER=openai"
        set "BASE_URL=https://api.deepseek.com/v1"
        set "DEFAULT_BIG=deepseek-chat"
        set "DEFAULT_SMALL=deepseek-chat"
        set "ENV_NAME=DEEPSEEK_API_KEY"
    ) else if "!CHOICE!"=="3" (
        set "PROVIDER=openai"
        set "BASE_URL=https://api.siliconflow.cn/v1"
        set "DEFAULT_BIG=Qwen/Qwen2.5-72B-Instruct"
        set "DEFAULT_SMALL=Qwen/Qwen2.5-7B-Instruct"
        set "ENV_NAME=SILICONFLOW_API_KEY"
    ) else if "!CHOICE!"=="4" (
        set "PROVIDER=openai"
        set "BASE_URL=https://openrouter.ai/api/v1"
        set "DEFAULT_BIG=anthropic/claude-sonnet-4"
        set "DEFAULT_SMALL=anthropic/claude-haiku-4"
        set "ENV_NAME=OPENROUTER_API_KEY"
    ) else if "!CHOICE!"=="5" (
        set "PROVIDER=anthropic"
        set "BASE_URL="
        set "DEFAULT_BIG=claude-sonnet-4-20250514"
        set "DEFAULT_SMALL=claude-haiku-4-5-20251001"
        set "ENV_NAME=ANTHROPIC_API_KEY"
    ) else if "!CHOICE!"=="6" (
        set "PROVIDER=ollama"
        set "BASE_URL=http://localhost:11434"
        set "DEFAULT_BIG=llama3:70b"
        set "DEFAULT_SMALL=llama3:8b"
        set "ENV_NAME="
    ) else if "!CHOICE!"=="7" (
        set "PROVIDER=openai"
        set /p "BASE_URL=  请输入 API Base URL: "
        set "DEFAULT_BIG="
        set "DEFAULT_SMALL="
        set "ENV_NAME=FEDAGENT_API_KEY"
    ) else (
        set "PROVIDER=openai"
        set "BASE_URL="
        set "DEFAULT_BIG=gpt-4o"
        set "DEFAULT_SMALL=gpt-4o-mini"
        set "ENV_NAME=OPENAI_API_KEY"
    )

    :: 获取 API Key
    set "API_KEY="
    if not "!PROVIDER!"=="ollama" (
        echo.
        set /p "API_KEY=  请输入 API Key: "
    )

    :: 模型名称
    echo.
    set /p "BIG_MODEL=  大模型名称 [!DEFAULT_BIG!]: "
    if "!BIG_MODEL!"=="" set "BIG_MODEL=!DEFAULT_BIG!"
    set /p "SMALL_MODEL=  小模型名称 [!DEFAULT_SMALL!]: "
    if "!SMALL_MODEL!"=="" set "SMALL_MODEL=!DEFAULT_SMALL!"

    :: 写入配置文件 — 只写环境变量引用，不写明文 key
    if "!ENV_NAME!"=="" set "ENV_NAME=FEDAGENT_API_KEY"
    (
        echo # FedAgent 配置文件
        echo # API Key 通过环境变量提供，不存储在此文件中
        echo # 设置方式: set !ENV_NAME!=your-key-here
        echo.
        echo provider: !PROVIDER!
    ) > config.yaml

    if not "!BASE_URL!"=="" (
        echo base_url: !BASE_URL!>> config.yaml
    )

    :: 写入环境变量引用而非明文
    echo api_key: ${!ENV_NAME!}>> config.yaml

    (
        echo.
        echo large_model: !BIG_MODEL!
        echo small_model: !SMALL_MODEL!
    ) >> config.yaml

    echo.
    echo   -^> 配置已保存到 config.yaml (不含 API Key)

    :: 保存到 .env 文件 (gitignore 已排除)
    if not "!API_KEY!"=="" (
        echo !ENV_NAME!=!API_KEY!> .env
        echo   -^> API Key 已保存到 .env (已被 .gitignore 排除)
    )
)

:: ---------- 加载 .env ----------
if exist ".env" (
    for /f "usebackq tokens=1,* delims==" %%a in (".env") do (
        set "%%a=%%b"
    )
)

echo.
echo ============================================
echo   启动 FedAgent 服务...
echo   访问地址: http://localhost:8000
echo   按 Ctrl+C 停止
echo ============================================
echo.

:: ---------- 启动服务 ----------
set PYTHONUTF8=1
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
