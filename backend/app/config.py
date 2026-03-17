"""
FedAgent 配置系统
支持多 LLM 提供商、第三方 API 平台、每个 Agent 可独立配置模型
"""

import os
import yaml
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ModelConfig:
    """单个模型配置"""
    provider: str           # "openai" / "anthropic" / "ollama" / "custom"
    model_id: str           # "gpt-4o" / "claude-opus-4-6" / "llama3:70b"
    api_key: str = ""       # API Key (可从环境变量读取)
    base_url: str = ""      # 自定义 API 端点 (第三方平台 / Ollama)
    temperature: float = 0.7
    max_tokens: int = 4096

    def resolve_api_key(self) -> str:
        """解析 API Key: 支持 ${ENV_VAR} 语法，并自动检测常见环境变量"""
        if self.api_key.startswith("${") and self.api_key.endswith("}"):
            env_var = self.api_key[2:-1]
            return os.environ.get(env_var, "")
        if self.api_key:
            return self.api_key
        # 自动从常见环境变量中获取
        for env_var in ["FEDAGENT_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]:
            val = os.environ.get(env_var, "")
            if val:
                return val
        return ""

    def resolve_base_url(self) -> str:
        """解析 Base URL"""
        if self.base_url.startswith("${") and self.base_url.endswith("}"):
            env_var = self.base_url[2:-1]
            return os.environ.get(env_var, "")
        return self.base_url


@dataclass
class AgentModelConfig:
    """单个 Agent 的模型配置 (可覆盖默认)"""
    tier: str = ""              # "large" / "small" (使用预设)
    provider: str = ""          # 覆盖: 直接指定提供商
    model_id: str = ""          # 覆盖: 直接指定模型
    api_key: str = ""           # 覆盖: 直接指定 Key
    base_url: str = ""          # 覆盖: 直接指定 URL
    temperature: float = -1     # 覆盖: -1 表示使用默认


@dataclass
class TriageConfig:
    """自适应分级配置"""
    l1_keywords: list = field(default_factory=lambda: [
        "什么是", "解释", "你好", "hello", "hi", "帮我查", "告诉我"
    ])
    l4_keywords: list = field(default_factory=lambda: [
        "删除", "迁移", "不可逆", "生产环境", "安全", "数据库", "部署"
    ])
    default_level: str = "L2"


@dataclass
class Config:
    """全局配置"""
    # 预设模型层级
    large_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="openai",
        model_id="gpt-4o",
        api_key="${OPENAI_API_KEY}",
    ))
    small_model: ModelConfig = field(default_factory=lambda: ModelConfig(
        provider="openai",
        model_id="gpt-4o-mini",
        api_key="${OPENAI_API_KEY}",
    ))

    # 每个 Agent 的独立配置 (可选覆盖)
    agents: dict[str, AgentModelConfig] = field(default_factory=dict)

    # 分级配置
    triage: TriageConfig = field(default_factory=TriageConfig)

    # 服务配置
    host: str = "0.0.0.0"
    port: int = 8787
    database_url: str = "sqlite+aiosqlite:///./fedagent.db"
    redis_url: str = ""  # 空 = 使用内存事件总线
    agents_dir: str = "agents"
    constitution_path: str = "CONSTITUTION.md"
    language: str = "zh"  # 默认中文

    def get_model_for_agent(self, agent_id: str) -> ModelConfig:
        """获取某个 Agent 应该使用的模型配置

        优先级:
        1. Agent 独立配置 (完全自定义)
        2. Agent tier 配置 (使用 large/small 预设)
        3. 默认: 4 个领导用大模型，其余用小模型
        """
        # 四个领导 Agent 默认用大模型
        large_agents = {"president", "speaker_house", "senate_leader", "chief_justice"}

        agent_cfg = self.agents.get(agent_id, AgentModelConfig())

        # 1. 完全自定义配置
        if agent_cfg.provider and agent_cfg.model_id:
            return ModelConfig(
                provider=agent_cfg.provider,
                model_id=agent_cfg.model_id,
                api_key=agent_cfg.api_key or (
                    self.large_model.api_key if agent_id in large_agents
                    else self.small_model.api_key
                ),
                base_url=agent_cfg.base_url,
                temperature=agent_cfg.temperature if agent_cfg.temperature >= 0 else 0.7,
            )

        # 2. 使用 tier 预设
        tier = agent_cfg.tier
        if not tier:
            tier = "large" if agent_id in large_agents else "small"

        base = self.large_model if tier == "large" else self.small_model

        return ModelConfig(
            provider=base.provider,
            model_id=base.model_id,
            api_key=base.api_key,
            base_url=base.base_url,
            temperature=agent_cfg.temperature if agent_cfg.temperature >= 0 else base.temperature,
            max_tokens=base.max_tokens,
        )


def load_config(config_path: str = "config.yaml") -> Config:
    """从 YAML 文件加载配置"""
    path = Path(config_path)
    if not path.exists():
        return Config()

    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    config = Config()

    # ---- 兼容简化配置格式 (start.ps1 生成的) ----
    # 简化格式: provider / api_key / base_url / large_model / small_model 在顶层
    top_provider = data.get("provider", "")
    top_api_key = data.get("api_key", "")
    top_base_url = data.get("base_url", "")
    top_large = data.get("large_model", "")
    top_small = data.get("small_model", "")

    if top_provider and (top_large or top_small):
        config.large_model = ModelConfig(
            provider=top_provider,
            model_id=top_large or "gpt-4o",
            api_key=top_api_key,
            base_url=top_base_url,
        )
        config.small_model = ModelConfig(
            provider=top_provider,
            model_id=top_small or top_large or "gpt-4o-mini",
            api_key=top_api_key,
            base_url=top_base_url,
        )

    # ---- 完整配置格式 (generate_default_config 生成的) ----
    models = data.get("models", {})
    if "large" in models:
        m = models["large"]
        config.large_model = ModelConfig(
            provider=m.get("provider", "openai"),
            model_id=m.get("model_id", "gpt-4o"),
            api_key=m.get("api_key", "${OPENAI_API_KEY}"),
            base_url=m.get("base_url", ""),
            temperature=m.get("temperature", 0.7),
            max_tokens=m.get("max_tokens", 4096),
        )
    if "small" in models:
        m = models["small"]
        config.small_model = ModelConfig(
            provider=m.get("provider", "openai"),
            model_id=m.get("model_id", "gpt-4o-mini"),
            api_key=m.get("api_key", "${OPENAI_API_KEY}"),
            base_url=m.get("base_url", ""),
            temperature=m.get("temperature", 0.7),
            max_tokens=m.get("max_tokens", 4096),
        )

    # 解析每个 Agent 的独立配置
    agents_cfg = data.get("agents", {})
    for agent_id, acfg in agents_cfg.items():
        if agent_id == "default":
            continue
        if isinstance(acfg, dict):
            config.agents[agent_id] = AgentModelConfig(
                tier=acfg.get("tier", ""),
                provider=acfg.get("provider", ""),
                model_id=acfg.get("model_id", ""),
                api_key=acfg.get("api_key", ""),
                base_url=acfg.get("base_url", ""),
                temperature=acfg.get("temperature", -1),
            )

    # 解析分级配置
    triage = data.get("triage", {})
    if triage:
        config.triage = TriageConfig(
            l1_keywords=triage.get("l1_keywords", config.triage.l1_keywords),
            l4_keywords=triage.get("l4_keywords", config.triage.l4_keywords),
            default_level=triage.get("default_level", "L2"),
        )

    # 服务配置
    server = data.get("server", {})
    config.host = server.get("host", "0.0.0.0")
    config.port = server.get("port", 8787)
    config.database_url = server.get("database_url", config.database_url)
    config.redis_url = server.get("redis_url", "")
    config.language = data.get("language", "zh")

    return config


def generate_default_config() -> str:
    """生成默认配置文件内容"""
    return """# FedAgent 配置文件
# 三权分立多 Agent 协作框架

language: zh  # 界面语言

# ═══════════════════════════════════════════════════
# 模型预设 - 定义大模型(领导层)和小模型(执行层)
# ═══════════════════════════════════════════════════
models:
  large:
    provider: "openai"              # openai / anthropic / ollama / custom
    model_id: "gpt-4o"              # 模型 ID
    api_key: "${OPENAI_API_KEY}"    # 从环境变量读取, 或直接填写
    base_url: ""                    # 留空使用官方地址, 填写则用第三方平台
    temperature: 0.7
    max_tokens: 4096

  small:
    provider: "openai"
    model_id: "gpt-4o-mini"
    api_key: "${OPENAI_API_KEY}"
    base_url: ""
    temperature: 0.7
    max_tokens: 4096

# ═══════════════════════════════════════════════════
# Agent 配置 - 每个 Agent 可独立指定模型
#
# 懒人模式: 不配置任何 agent, 系统自动分配:
#   4 个领导 (president, speaker_house, senate_leader, chief_justice) → 大模型
#   其余 12 个 → 小模型
#
# 自定义模式: 给任意 Agent 指定不同的提供商和模型
# ═══════════════════════════════════════════════════
agents:
  # 默认: 4 个领导用大模型, 其余用小模型 (不需要配置)

  # --- 示例: 给总统换成 Claude ---
  # president:
  #   provider: "anthropic"
  #   model_id: "claude-opus-4-6"
  #   api_key: "${ANTHROPIC_API_KEY}"

  # --- 示例: 给某个 Agent 用本地 Ollama ---
  # sec_operations:
  #   provider: "ollama"
  #   model_id: "qwen2.5:32b"
  #   base_url: "http://localhost:11434"

  # --- 示例: 用第三方 API 平台 (如 DeepSeek, 硅基流动, OpenRouter 等) ---
  # house_committee:
  #   provider: "custom"
  #   model_id: "deepseek-chat"
  #   api_key: "${DEEPSEEK_API_KEY}"
  #   base_url: "https://api.deepseek.com/v1"

  # --- 示例: 强制某个 Agent 用大模型 ---
  # attorney_general:
  #   tier: "large"

# ═══════════════════════════════════════════════════
# 自适应分级 - 控制任务如何被自动分级
# ═══════════════════════════════════════════════════
triage:
  l1_keywords: ["什么是", "解释", "你好", "hello", "帮我查", "告诉我"]
  l4_keywords: ["删除", "迁移", "不可逆", "生产环境", "安全", "数据库"]
  default_level: "L2"

# ═══════════════════════════════════════════════════
# 服务配置
# ═══════════════════════════════════════════════════
server:
  host: "0.0.0.0"
  port: 8787
  database_url: "sqlite+aiosqlite:///./fedagent.db"
  redis_url: ""  # 留空 = 使用内存事件总线 (开发模式)
"""
