#!/bin/bash
# ============================================
#  FedAgent — One-click Start Script
#  Usage: bash start.sh
# ============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "  ============================================"
echo "       F E D A G E N T"
echo "  ============================================"
echo "  Separation of Powers Multi-Agent System"
echo ""

# ---------- Check Python ----------
if ! command -v python &>/dev/null; then
    echo "[ERROR] Python not found. Please install Python 3.10+"
    read -p "Press Enter to exit..."
    exit 1
fi

PY_VER=$(python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "[OK] Python $PY_VER"

# ---------- Check Node.js ----------
if ! command -v node &>/dev/null; then
    echo "[ERROR] Node.js not found. Please install Node.js 18+"
    read -p "Press Enter to exit..."
    exit 1
fi

NODE_VER=$(node -v)
echo "[OK] Node.js $NODE_VER"

# ---------- Install Python deps ----------
echo ""
echo "[1/4] Installing Python dependencies..."
export PYTHONUTF8=1
pip install -q fastapi uvicorn sqlalchemy aiosqlite pyyaml httpx openai 2>/dev/null
echo "  -> Done"

# ---------- Install frontend deps ----------
echo "[2/4] Installing frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    cd frontend && npm install --silent 2>/dev/null && cd ..
    echo "  -> Done"
else
    echo "  -> Already installed, skip"
fi

# ---------- Build frontend ----------
echo "[3/4] Building frontend..."
if [ ! -d "frontend/dist" ] || [ "frontend/src/App.tsx" -nt "frontend/dist/index.html" ]; then
    cd frontend && npx vite build --logLevel error 2>/dev/null && cd ..
    echo "  -> Done"
else
    echo "  -> Already built, skip"
fi

# ---------- Check config ----------
echo "[4/4] Checking config..."
CONFIG_FILE="config.yaml"
if [ ! -f "$CONFIG_FILE" ]; then
    echo ""
    echo "  First run - configure your LLM provider:"
    echo ""
    echo "    1) OpenAI"
    echo "    2) DeepSeek"
    echo "    3) SiliconFlow"
    echo "    4) OpenRouter"
    echo "    5) Anthropic (Claude)"
    echo "    6) Ollama (local)"
    echo "    7) Other OpenAI-compatible API"
    echo ""
    read -p "  Enter number [1-7]: " choice

    case "$choice" in
        1) PROVIDER="openai";  BASE_URL=""; DEFAULT_BIG="gpt-4o"; DEFAULT_SMALL="gpt-4o-mini"; ENV_NAME="OPENAI_API_KEY" ;;
        2) PROVIDER="openai";  BASE_URL="https://api.deepseek.com/v1"; DEFAULT_BIG="deepseek-chat"; DEFAULT_SMALL="deepseek-chat"; ENV_NAME="DEEPSEEK_API_KEY" ;;
        3) PROVIDER="openai";  BASE_URL="https://api.siliconflow.cn/v1"; DEFAULT_BIG="Qwen/Qwen2.5-72B-Instruct"; DEFAULT_SMALL="Qwen/Qwen2.5-7B-Instruct"; ENV_NAME="SILICONFLOW_API_KEY" ;;
        4) PROVIDER="openai";  BASE_URL="https://openrouter.ai/api/v1"; DEFAULT_BIG="anthropic/claude-sonnet-4"; DEFAULT_SMALL="anthropic/claude-haiku-4"; ENV_NAME="OPENROUTER_API_KEY" ;;
        5) PROVIDER="anthropic"; BASE_URL=""; DEFAULT_BIG="claude-sonnet-4-20250514"; DEFAULT_SMALL="claude-haiku-4-5-20251001"; ENV_NAME="ANTHROPIC_API_KEY" ;;
        6) PROVIDER="ollama";  BASE_URL="http://localhost:11434"; DEFAULT_BIG="llama3:70b"; DEFAULT_SMALL="llama3:8b"; ENV_NAME="" ;;
        7) PROVIDER="openai";  read -p "  Enter API Base URL: " BASE_URL; DEFAULT_BIG=""; DEFAULT_SMALL=""; ENV_NAME="FEDAGENT_API_KEY" ;;
        *) PROVIDER="openai";  BASE_URL=""; DEFAULT_BIG="gpt-4o"; DEFAULT_SMALL="gpt-4o-mini"; ENV_NAME="OPENAI_API_KEY" ;;
    esac

    # Get API Key
    API_KEY=""
    if [ "$PROVIDER" != "ollama" ]; then
        echo ""
        read -sp "  Enter API Key (hidden): " API_KEY
        echo ""
    fi

    # Model names
    echo ""
    read -p "  Large model [$DEFAULT_BIG]: " BIG_MODEL
    BIG_MODEL=${BIG_MODEL:-$DEFAULT_BIG}
    read -p "  Small model [$DEFAULT_SMALL]: " SMALL_MODEL
    SMALL_MODEL=${SMALL_MODEL:-$DEFAULT_SMALL}

    # Write config — env var reference only
    cat > "$CONFIG_FILE" << YAML
# FedAgent Config
# API Key loaded from .env file via environment variable

provider: $PROVIDER
$([ -n "$BASE_URL" ] && echo "base_url: $BASE_URL")
api_key: \${${ENV_NAME:-FEDAGENT_API_KEY}}

large_model: $BIG_MODEL
small_model: $SMALL_MODEL
YAML

    echo ""
    echo "  -> Config saved to $CONFIG_FILE (no API key in file)"

    # Save to .env (excluded by .gitignore)
    if [ -n "$API_KEY" ]; then
        echo "${ENV_NAME:-FEDAGENT_API_KEY}=$API_KEY" > .env
        echo "  -> API Key saved to .env (excluded by .gitignore)"
    fi
fi

# ---------- Load .env ----------
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

echo ""
echo "============================================"
echo "  Starting FedAgent server..."
echo "  URL: http://localhost:8000"
echo "  Press Ctrl+C to stop"
echo "============================================"
echo ""

# ---------- Start ----------
export PYTHONUTF8=1
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
