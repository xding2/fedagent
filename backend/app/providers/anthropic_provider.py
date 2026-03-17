"""Anthropic Claude API 提供商"""

from typing import AsyncIterator
from .base import BaseLLMProvider, LLMResponse

try:
    from anthropic import AsyncAnthropic
except ImportError:
    AsyncAnthropic = None


class AnthropicProvider(BaseLLMProvider):
    """Anthropic Claude API"""

    def __init__(self, api_key: str, base_url: str = ""):
        if AsyncAnthropic is None:
            raise ImportError("请安装 anthropic: pip install anthropic")
        kwargs = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = AsyncAnthropic(**kwargs)

    async def chat(
        self,
        model: str,
        system: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        resp = await self.client.messages.create(
            model=model,
            system=system,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = resp.content[0].text if resp.content else ""
        return LLMResponse(
            content=content,
            input_tokens=resp.usage.input_tokens,
            output_tokens=resp.usage.output_tokens,
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
        async with self.client.messages.stream(
            model=model,
            system=system,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        ) as stream:
            async for text in stream.text_stream:
                yield text
