#!/bin/bash
# ============================================
#  FedAgent — 一键启动脚本
#  用法: bash start.sh
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "  ███████╗███████╗██████╗  █████╗  ██████╗ ███████╗███╗   ██╗████████╗"
echo "  ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝"
echo "  █████╗  █████╗  ██║  ██║███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   "
echo "  ██╔══╝  ██╔══╝  ██║  ██║██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   "
echo "  ██║     ███████╗██████╔╝██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   "
echo "  ╚═╝     ╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   "
echo ""
echo "  三权分立多 Agent 协作系统"
echo "  ============================================"
echo ""

# ---------- 检查 Python ----------
if ! command -v python &>/dev/null; then
    echo "[ERROR] 未找到 Python，请先安装 Python 3.10+"
    read -p "按回车退出..."
    exit 1
fi

PY_VER=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "[OK] Python $PY_VER"

# ---------- 检查 Node.js ----------
if ! command -v node &>/dev/null; then
    echo "[ERROR] 未找到 Node.js，请先安装 Node.js 18+"
    read -p "按回车退出..."
    exit 1
fi

NODE_VER=$(node -v)
echo "[OK] Node.js $NODE_VER"

# ---------- 安装 Python 依赖 ----------
echo ""
echo "[1/4] 安装 Python 依赖..."
export PYTHONUTF8=1
pip install -q fastapi uvicorn sqlalchemy aiosqlite pyyaml httpx openai 2>/dev/null
echo "  -> 完成"

# ---------- 安装前端依赖 ----------
echo "[2/4] 安装前端依赖..."
if [ ! -d "frontend/node_modules" ]; then
    cd frontend && npm install --silent 2>/dev/null && cd ..
    echo "  -> 完成"
else
    echo "  -> 已存在，跳过"
fi

# ---------- 构建前端 ----------
echo "[3/4] 构建前端..."
if [ ! -d "frontend/dist" ] || [ "frontend/src/App.tsx" -nt "frontend/dist/index.html" ]; then
    cd frontend && npx vite build --logLevel error 2>/dev/null && cd ..
    echo "  -> 完成"
else
    echo "  -> 已是最新，跳过"
fi

# ---------- 检查配置 ----------
echo "[4/4] 检查配置..."
CONFIG_FILE="config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo ""
    echo "  首次运行，需要配置 API 信息。"
    echo "  请选择你的 LLM 提供商:"
    echo ""
    echo "    1) OpenAI (官方)"
    echo "    2) DeepSeek"
    echo "    3) SiliconFlow (硅基流动)"
    echo "    4) OpenRouter"
    echo "    5) Anthropic (Claude)"
    echo "    6) Ollama (本地模型)"
    echo "    7) 其他 OpenAI 兼容 API"
    echo ""
    read -p "  请输入编号 [1-7]: " choice

    case "$choice" in
        1) PROVIDER="openai";  BASE_URL=""; DEFAULT_BIG="gpt-4o"; DEFAULT_SMALL="gpt-4o-mini"; ENV_NAME="OPENAI_API_KEY" ;;
        2) PROVIDER="openai";  BASE_URL="https://api.deepseek.com/v1"; DEFAULT_BIG="deepseek-chat"; DEFAULT_SMALL="deepseek-chat"; ENV_NAME="DEEPSEEK_API_KEY" ;;
        3) PROVIDER="openai";  BASE_URL="https://api.siliconflow.cn/v1"; DEFAULT_BIG="Qwen/Qwen2.5-72B-Instruct"; DEFAULT_SMALL="Qwen/Qwen2.5-7B-Instruct"; ENV_NAME="SILICONFLOW_API_KEY" ;;
        4) PROVIDER="openai";  BASE_URL="https://openrouter.ai/api/v1"; DEFAULT_BIG="anthropic/claude-sonnet-4"; DEFAULT_SMALL="anthropic/claude-haiku-4"; ENV_NAME="OPENROUTER_API_KEY" ;;
        5) PROVIDER="anthropic"; BASE_URL=""; DEFAULT_BIG="claude-sonnet-4-20250514"; DEFAULT_SMALL="claude-haiku-4-5-20251001"; ENV_NAME="ANTHROPIC_API_KEY" ;;
        6) PROVIDER="ollama";  BASE_URL="http://localhost:11434"; DEFAULT_BIG="llama3:70b"; DEFAULT_SMALL="llama3:8b"; ENV_NAME="" ;;
        7) PROVIDER="openai";  read -p "  请输入 API Base URL: " BASE_URL; DEFAULT_BIG=""; DEFAULT_SMALL=""; ENV_NAME="FEDAGENT_API_KEY" ;;
        *) PROVIDER="openai";  BASE_URL=""; DEFAULT_BIG="gpt-4o"; DEFAULT_SMALL="gpt-4o-mini"; ENV_NAME="OPENAI_API_KEY" ;;
    esac

    # 获取 API Key — 存入环境变量而非文件
    API_KEY=""
    if [ "$PROVIDER" != "ollama" ]; then
        echo ""
        read -sp "  请输入 API Key (输入不可见): " API_KEY
        echo ""
    fi

    # 模型名称
    echo ""
    read -p "  大模型名称 [$DEFAULT_BIG]: " BIG_MODEL
    BIG_MODEL=${BIG_MODEL:-$DEFAULT_BIG}
    read -p "  小模型名称 [$DEFAULT_SMALL]: " SMALL_MODEL
    SMALL_MODEL=${SMALL_MODEL:-$DEFAULT_SMALL}

    # 生成配置文件 — 只写环境变量引用，不写明文 key
    cat > "$CONFIG_FILE" << YAML
# FedAgent 配置文件 (自动生成)
# API Key 通过环境变量提供，不存储在此文件中
# 设置方式: export ${ENV_NAME:-FEDAGENT_API_KEY}=your-key-here

provider: $PROVIDER
$([ -n "$BASE_URL" ] && echo "base_url: $BASE_URL")
api_key: \${${ENV_NAME:-FEDAGENT_API_KEY}}

large_model: $BIG_MODEL
small_model: $SMALL_MODEL
YAML

    echo ""
    echo "  -> 配置已保存到 $CONFIG_FILE (不含 API Key)"
    echo "  -> API Key 将通过环境变量传递"

    # 保存到 .env 文件 (gitignore 已排除)
    if [ -n "$API_KEY" ]; then
        echo "${ENV_NAME:-FEDAGENT_API_KEY}=$API_KEY" > .env
        echo "  -> API Key 已保存到 .env (已被 .gitignore 排除)"
    fi
fi

# ---------- 加载 .env ----------
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

echo ""
echo "============================================"
echo "  启动 FedAgent 服务..."
echo "  访问地址: http://localhost:8000"
echo "  按 Ctrl+C 停止"
echo "============================================"
echo ""

# ---------- 启动服务 ----------
export PYTHONUTF8=1
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
