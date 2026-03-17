"""
FedAgent CLI — 命令行入口
fedagent init   → 交互式初始化配置
fedagent start  → 启动服务 (后端 + 前端)
fedagent run    → 命令行直接提交任务
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path


def banner():
    print("""
  ███████╗███████╗██████╗  █████╗  ██████╗ ███████╗███╗   ██╗████████╗
  ██╔════╝██╔════╝██╔══██╗██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝
  █████╗  █████╗  ██║  ██║███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║
  ██╔══╝  ██╔══╝  ██║  ██║██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║
  ██║     ███████╗██████╔╝██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║
  ╚═╝     ╚══════╝╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝

  三权分立 · 多 Agent 协作框架
  Three Branches. One Goal. Better AI.
""")


def cmd_init(args):
    """交互式初始化"""
    banner()

    config_path = Path("config.yaml")
    if config_path.exists():
        overwrite = input("config.yaml 已存在，是否覆盖？(y/N): ").strip().lower()
        if overwrite != "y":
            print("已取消")
            return

    # 选择大模型提供商
    print("\n选择大模型提供商 (领导层: 总统/议长/大法官):")
    print("  1. OpenAI (GPT-4o)")
    print("  2. Anthropic (Claude Opus)")
    print("  3. Ollama (本地模型, 免费)")
    print("  4. 第三方平台 (DeepSeek/硅基流动/OpenRouter 等)")

    large_choice = input("请选择 [1]: ").strip() or "1"

    large_provider = "openai"
    large_model = "gpt-4o"
    large_key = "${OPENAI_API_KEY}"
    large_url = ""

    if large_choice == "2":
        large_provider = "anthropic"
        large_model = "claude-opus-4-6"
        large_key = input("Anthropic API Key: ").strip() or "${ANTHROPIC_API_KEY}"
    elif large_choice == "3":
        large_provider = "ollama"
        large_model = input("模型名称 (如 llama3:70b): ").strip() or "llama3:70b"
        large_key = ""
        large_url = input("Ollama 地址 [http://localhost:11434]: ").strip() or "http://localhost:11434"
    elif large_choice == "4":
        large_provider = "custom"
        large_url = input("API Base URL: ").strip()
        large_model = input("模型 ID: ").strip()
        large_key = input("API Key: ").strip()
    else:
        large_key = input("OpenAI API Key: ").strip() or "${OPENAI_API_KEY}"

    # 选择小模型
    print("\n选择小模型提供商 (执行层: 委员会/部长等):")
    print("  1. 与大模型相同提供商 (推荐)")
    print("  2. 单独配置")

    small_choice = input("请选择 [1]: ").strip() or "1"

    if small_choice == "1":
        small_provider = large_provider
        small_url = large_url
        small_key = large_key
        if large_provider == "openai":
            small_model = "gpt-4o-mini"
        elif large_provider == "anthropic":
            small_model = "claude-haiku-4-5"
        elif large_provider == "ollama":
            small_model = input("小模型名称 (如 llama3:8b): ").strip() or "llama3:8b"
        else:
            small_model = input("小模型 ID: ").strip()
    else:
        small_provider = input("提供商 (openai/anthropic/ollama/custom): ").strip()
        small_model = input("模型 ID: ").strip()
        small_key = input("API Key: ").strip() or large_key
        small_url = input("Base URL (留空使用官方): ").strip()

    # 生成配置文件
    from backend.app.config import generate_default_config
    config_content = generate_default_config()

    # 替换实际值
    replacements = {
        'provider: "openai"              # openai / anthropic / ollama / custom\n    model_id: "gpt-4o"':
            f'provider: "{large_provider}"\n    model_id: "{large_model}"',
        'provider: "openai"\n    model_id: "gpt-4o-mini"':
            f'provider: "{small_provider}"\n    model_id: "{small_model}"',
    }
    if large_key and not large_key.startswith("${"):
        replacements['api_key: "${OPENAI_API_KEY}"    # 从环境变量读取, 或直接填写'] = f'api_key: "{large_key}"'

    for old, new in replacements.items():
        config_content = config_content.replace(old, new, 1)

    if large_url:
        config_content = config_content.replace(
            'base_url: ""                    # 留空使用官方地址',
            f'base_url: "{large_url}"',
            1
        )

    config_path.write_text(config_content, encoding="utf-8")
    print(f"\n✅ config.yaml 已创建")

    # 复制宪法
    constitution_src = Path(__file__).parent.parent / "CONSTITUTION.md"
    constitution_dst = Path("CONSTITUTION.md")
    if constitution_src.exists() and not constitution_dst.exists():
        import shutil
        shutil.copy2(constitution_src, constitution_dst)
        print("✅ CONSTITUTION.md 已创建")

    print(f"\n🚀 运行 `python -m fedagent start` 启动服务！")


def cmd_start(args):
    """启动服务"""
    banner()
    port = args.port or 8787
    print(f"启动 FedAgent 服务...")
    print(f"地址: http://localhost:{port}")
    print(f"按 Ctrl+C 停止\n")

    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=port,
        reload=args.reload,
        log_level="info",
    )


def cmd_run(args):
    """命令行提交任务"""
    import httpx

    message = " ".join(args.message)
    if not message:
        print("请输入任务内容")
        return

    port = args.port or 8787
    base = f"http://localhost:{port}"

    try:
        resp = httpx.post(f"{base}/api/submit", json={
            "message": message,
            "level": args.level or "",
        })
        data = resp.json()
        task_id = data.get("task_id", "")
        print(f"✅ 任务已提交: {task_id}")
        print(f"📊 查看进度: {base}")
    except httpx.ConnectError:
        print(f"❌ 无法连接到 FedAgent 服务 ({base})")
        print("   请先运行: python -m fedagent start")


def main():
    parser = argparse.ArgumentParser(
        description="FedAgent — 三权分立多 Agent 协作框架",
        prog="fedagent",
    )
    subparsers = parser.add_subparsers(dest="command")

    # init
    init_parser = subparsers.add_parser("init", help="交互式初始化配置")

    # start
    start_parser = subparsers.add_parser("start", help="启动服务")
    start_parser.add_argument("--port", type=int, default=8787, help="端口号")
    start_parser.add_argument("--reload", action="store_true", help="开发模式热重载")

    # run
    run_parser = subparsers.add_parser("run", help="提交任务")
    run_parser.add_argument("message", nargs="*", help="任务内容")
    run_parser.add_argument("--level", default="", help="强制级别 (L1/L2/L3/L4)")
    run_parser.add_argument("--port", type=int, default=8787)

    args = parser.parse_args()

    if args.command == "init":
        cmd_init(args)
    elif args.command == "start":
        cmd_start(args)
    elif args.command == "run":
        cmd_run(args)
    else:
        banner()
        parser.print_help()


if __name__ == "__main__":
    main()
