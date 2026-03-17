# FedAgent — Windows PowerShell 一键启动脚本
# 用法: powershell -ExecutionPolicy Bypass -File start.ps1

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "       F E D A G E N T" -ForegroundColor Cyan
Write-Host "  ============================================" -ForegroundColor Cyan
Write-Host "  Separation of Powers Multi-Agent System" -ForegroundColor Yellow
Write-Host ""

# ---------- Check Python ----------
try {
    $pyVer = python --version 2>&1
    Write-Host "[OK] $pyVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Python not found. Please install Python 3.10+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# ---------- Check Node.js ----------
try {
    $nodeVer = node --version 2>&1
    Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# ---------- Install Python deps ----------
Write-Host ""
Write-Host "[1/4] Installing Python dependencies..." -ForegroundColor White
$env:PYTHONUTF8 = "1"
& pip install -q fastapi uvicorn sqlalchemy aiosqlite pyyaml httpx openai 2>&1 | Out-Null
Write-Host "  -> Done" -ForegroundColor DarkGray

# ---------- Install frontend deps ----------
Write-Host "[2/4] Installing frontend dependencies..." -ForegroundColor White
if (-not (Test-Path "frontend\node_modules")) {
    Push-Location frontend
    & npm install --silent 2>&1 | Out-Null
    Pop-Location
    Write-Host "  -> Done" -ForegroundColor DarkGray
} else {
    Write-Host "  -> Already installed, skip" -ForegroundColor DarkGray
}

# ---------- Build frontend ----------
Write-Host "[3/4] Building frontend..." -ForegroundColor White
if (-not (Test-Path "frontend\dist\index.html")) {
    Push-Location frontend
    & npx vite build --logLevel error 2>&1 | Out-Null
    Pop-Location
    Write-Host "  -> Done" -ForegroundColor DarkGray
} else {
    Write-Host "  -> Already built, skip" -ForegroundColor DarkGray
}

# ---------- Check config ----------
Write-Host "[4/4] Checking config..." -ForegroundColor White
if (-not (Test-Path "config.yaml")) {
    Write-Host ""
    Write-Host "  First run - configure your LLM provider:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    1) OpenAI" -ForegroundColor White
    Write-Host "    2) DeepSeek" -ForegroundColor White
    Write-Host "    3) SiliconFlow" -ForegroundColor White
    Write-Host "    4) OpenRouter" -ForegroundColor White
    Write-Host "    5) Anthropic (Claude)" -ForegroundColor White
    Write-Host "    6) Ollama (local)" -ForegroundColor White
    Write-Host "    7) Other OpenAI-compatible API" -ForegroundColor White
    Write-Host ""

    $choice = Read-Host "  Enter number [1-7]"

    switch ($choice) {
        "1" { $provider="openai";    $baseUrl="";                                    $defBig="gpt-4o";                       $defSmall="gpt-4o-mini";  $envName="OPENAI_API_KEY" }
        "2" { $provider="openai";    $baseUrl="https://api.deepseek.com/v1";         $defBig="deepseek-chat";                $defSmall="deepseek-chat"; $envName="DEEPSEEK_API_KEY" }
        "3" { $provider="openai";    $baseUrl="https://api.siliconflow.cn/v1";       $defBig="Qwen/Qwen2.5-72B-Instruct";   $defSmall="Qwen/Qwen2.5-7B-Instruct"; $envName="SILICONFLOW_API_KEY" }
        "4" { $provider="openai";    $baseUrl="https://openrouter.ai/api/v1";        $defBig="anthropic/claude-sonnet-4";    $defSmall="anthropic/claude-haiku-4"; $envName="OPENROUTER_API_KEY" }
        "5" { $provider="anthropic"; $baseUrl="";                                    $defBig="claude-sonnet-4-20250514";     $defSmall="claude-haiku-4-5-20251001"; $envName="ANTHROPIC_API_KEY" }
        "6" { $provider="ollama";    $baseUrl="http://localhost:11434";               $defBig="llama3:70b";                   $defSmall="llama3:8b"; $envName="" }
        "7" { $provider="openai";    $baseUrl=Read-Host "  Enter API Base URL";      $defBig="";                             $defSmall=""; $envName="FEDAGENT_API_KEY" }
        default { $provider="openai"; $baseUrl="";                                   $defBig="gpt-4o";                       $defSmall="gpt-4o-mini"; $envName="OPENAI_API_KEY" }
    }

    # API Key — masked input, stored as env var not in config file
    $apiKey = ""
    if ($provider -ne "ollama") {
        Write-Host ""
        $secureKey = Read-Host "  Enter API Key" -AsSecureString
        $apiKey = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey))
    }

    # Model names
    Write-Host ""
    $bigModel = Read-Host "  Large model name [$defBig]"
    if ([string]::IsNullOrWhiteSpace($bigModel)) { $bigModel = $defBig }
    $smallModel = Read-Host "  Small model name [$defSmall]"
    if ([string]::IsNullOrWhiteSpace($smallModel)) { $smallModel = $defSmall }

    # Write config — env var reference only, no plaintext key
    if (-not $envName) { $envName = "FEDAGENT_API_KEY" }
    $lines = @(
        "# FedAgent Config"
        "# API Key is provided via environment variable, NOT stored here"
        "# Set it: `$envName=your-key-here`"
        ""
        "provider: $provider"
    )
    if ($baseUrl) { $lines += "base_url: $baseUrl" }
    $lines += "api_key: `${$envName}"  # ${ENV_VAR} reference
    $lines += ""
    $lines += "large_model: $bigModel"
    $lines += "small_model: $smallModel"

    $lines | Out-File -FilePath "config.yaml" -Encoding utf8

    Write-Host ""
    Write-Host "  -> Config saved to config.yaml (no API key in file)" -ForegroundColor Green

    # Save key to .env file (excluded by .gitignore)
    if ($apiKey) {
        "$envName=$apiKey" | Out-File -FilePath ".env" -Encoding utf8 -NoNewline
        Write-Host "  -> API Key saved to .env (excluded by .gitignore)" -ForegroundColor Green
    }
}

# ---------- Load .env ----------
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Starting FedAgent server..." -ForegroundColor White
Write-Host "  URL: http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Press Ctrl+C to stop" -ForegroundColor DarkGray
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ---------- Start server ----------
$env:PYTHONUTF8 = "1"
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
