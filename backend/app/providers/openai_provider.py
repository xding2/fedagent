"""OpenAI / OpenAI 兼容 API 提供商 (含第三方平台: DeepSeek, 硅基流动, OpenRouter 等)"""

from typing import AsyncIterator
from .base import BaseLLMProvider, LLMResponse

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None


class OpenAIProvider(BaseLLMProvider):
    """OpenAI API 提供商

    同时支持所有 OpenAI 兼容接口:
    - OpenAI 官方
    - DeepSeek (base_url="https://api.deepseek.com/v1")
    - 硅基流动 (base_url="https://api.siliconflow.cn/v1")
    - OpenRouter (base_url="https://openrouter.ai/api/v1")
    - 任何 OpenAI 兼容接口
    """

    def __init__(self, api_key: str, base_url: str = ""):
        if AsyncOpenAI is None:
            raise ImportError("请安装 openai: pip install openai")
        kwargs = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = AsyncOpenAI(**kwargs)

    async def chat(
        self,
        model: str,
        system: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        msgs = [{"role": "system", "content": system}] + messages
        resp = await self.client.chat.completions.create(
            model=model,
            messages=msgs,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        choice = resp.choices[0]
        usage = resp.usage
        return LLMResponse(
            content=choice.message.content or "",
            input_tokens=usage.prompt_tokens if usage else 0,
            output_tokens=usage.completion_tokens if usage else 0,
            model=model,
        )

    async def stream(
        self,
        model: str,
        system: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        msgs = [{"role": "system", "content": system}] + messages
        resp = await self.client.chat.completions.create(
            model=model,
            messages=msgs,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in resp:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
