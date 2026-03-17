"""
AgentRunner — 统一 Agent 调用层
框架无关，支持任意 LLM 提供商，按 PROFILE.md 构建 system prompt
"""

import logging
from pathlib import Path
from dataclasses import dataclass
from typing import AsyncIterator, Callable, Optional

from .config import Config, ModelConfig
from .providers.base import BaseLLMProvider, LLMResponse
from .providers.openai_provider import OpenAIProvider
from .providers.anthropic_provider import AnthropicProvider
from .providers.ollama_provider import OllamaProvider

logger = logging.getLogger(__name__)


@dataclass
class AgentResponse:
    """Agent 调用结果"""
    agent_id: str
    content: str
    input_tokens: int = 0
    output_tokens: int = 0
    model: str = ""


class AgentRunner:
    """统一 Agent 调用层

    - 加载 PROFILE.md 作为 system prompt
    - 根据配置选择 LLM 提供商和模型
    - 支持同步和流式调用
    """

    def __init__(self, config: Config, agents_dir: str = "agents"):
        self.config = config
        self.agents_dir = Path(agents_dir)
        self._providers: dict[str, BaseLLMProvider] = {}
        self._profile_cache: dict[str, str] = {}
        self._init_providers()

    def _init_providers(self):
        """初始化所有需要的 LLM 提供商"""
        # 收集所有用到的 (provider, api_key, base_url) 组合
        seen = set()
        all_agent_ids = [
            "president", "chief_of_staff", "sec_strategy", "sec_research",
            "sec_operations", "sec_quality", "attorney_general",
            "speaker_house", "senate_leader", "house_committee",
            "senate_committee", "cbo",
            "chief_justice", "justice_progressive", "justice_originalist",
            "press_secretary",
        ]

        for agent_id in all_agent_ids:
            model_cfg = self.config.get_model_for_agent(agent_id)
            key = (model_cfg.provider, model_cfg.resolve_api_key(), model_cfg.resolve_base_url())
            if key not in seen:
                seen.add(key)
                provider_key = f"{model_cfg.provider}:{model_cfg.resolve_base_url()}"
                if provider_key not in self._providers:
                    try:
                        self._providers[provider_key] = self._create_provider(model_cfg)
                    except ImportError as e:
                        logger.warning(f"无法初始化提供商 {model_cfg.provider}: {e}")

    def _create_provider(self, model_cfg: ModelConfig) -> BaseLLMProvider:
        """创建 LLM 提供商实例"""
        api_key = model_cfg.resolve_api_key()
        base_url = model_cfg.resolve_base_url()

        if model_cfg.provider == "anthropic":
            return AnthropicProvider(api_key=api_key, base_url=base_url)
        elif model_cfg.provider == "ollama":
            return OllamaProvider(base_url=base_url or "http://localhost:11434")
        else:
            # openai / custom / 任何兼容接口
            return OpenAIProvider(api_key=api_key, base_url=base_url)

    def _get_provider(self, model_cfg: ModelConfig) -> BaseLLMProvider:
        """获取指定配置的提供商"""
        provider_key = f"{model_cfg.provider}:{model_cfg.resolve_base_url()}"
        if provider_key not in self._providers:
            self._providers[provider_key] = self._create_provider(model_cfg)
        return self._providers[provider_key]

    def load_profile(self, agent_id: str) -> str:
        """加载 Agent 的 PROFILE.md 作为 system prompt"""
        if agent_id in self._profile_cache:
            return self._profile_cache[agent_id]

        # 搜索 PROFILE.md
        for branch in ["executive", "legislative", "judicial", "independent"]:
            profile_path = self.agents_dir / branch / agent_id / "PROFILE.md"
            if profile_path.exists():
                content = profile_path.read_text(encoding="utf-8")
                self._profile_cache[agent_id] = content
                return content

        # 回退: 使用默认 prompt
        default_prompt = f"你是 FedAgent 系统中的 {agent_id} Agent。请根据你的角色职责处理任务。使用中文回复。"
        self._profile_cache[agent_id] = default_prompt
        return default_prompt

    async def run(
        self,
        agent_id: str,
        message: str,
        context: Optional[dict] = None,
    ) -> AgentResponse:
        """同步调用 Agent"""
        model_cfg = self.config.get_model_for_agent(agent_id)
        provider = self._get_provider(model_cfg)
        profile = self.load_profile(agent_id)

        # 构建消息
        user_message = message
        if context:
            ctx_str = "\n".join(f"- {k}: {v}" for k, v in context.items())
            user_message = f"## 上下文\n{ctx_str}\n\n## 任务\n{message}"

        resp = await provider.chat(
            model=model_cfg.model_id,
            system=profile,
            messages=[{"role": "user", "content": user_message}],
            temperature=model_cfg.temperature,
            max_tokens=model_cfg.max_tokens,
        )

        return AgentResponse(
            agent_id=agent_id,
            content=resp.content,
            input_tokens=resp.input_tokens,
            output_tokens=resp.output_tokens,
            model=resp.model or model_cfg.model_id,
        )

    async def run_streaming(
        self,
        agent_id: str,
        message: str,
        context: Optional[dict] = None,
        on_chunk: Optional[Callable] = None,
    ) -> AgentResponse:
        """流式调用 Agent — 每个 chunk 实时回调"""
        model_cfg = self.config.get_model_for_agent(agent_id)
        provider = self._get_provider(model_cfg)
        profile = self.load_profile(agent_id)

        user_message = message
        if context:
            ctx_str = "\n".join(f"- {k}: {v}" for k, v in context.items())
            user_message = f"## 上下文\n{ctx_str}\n\n## 任务\n{message}"

        full_response = ""
        async for chunk in provider.stream(
            model=model_cfg.model_id,
            system=profile,
            messages=[{"role": "user", "content": user_message}],
            temperature=model_cfg.temperature,
            max_tokens=model_cfg.max_tokens,
        ):
            full_response += chunk
            if on_chunk:
                await on_chunk(chunk)

        return AgentResponse(
            agent_id=agent_id,
            content=full_response,
            model=model_cfg.model_id,
        )
