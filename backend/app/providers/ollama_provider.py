"""Ollama 本地模型提供商"""

import json
from typing import AsyncIterator
from .base import BaseLLMProvider, LLMResponse

try:
    import httpx
except ImportError:
    httpx = None


class OllamaProvider(BaseLLMProvider):
    """Ollama 本地模型 (免 API Key)"""

    def __init__(self, base_url: str = "http://localhost:11434"):
        if httpx is None:
            raise ImportError("请安装 httpx: pip install httpx")
        self.base_url = base_url.rstrip("/")
        self.client = httpx.AsyncClient(timeout=120.0)

    async def chat(
        self,
        model: str,
        system: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        msgs = [{"role": "system", "content": system}] + messages
        resp = await self.client.post(
            f"{self.base_url}/api/chat",
            json={
                "model": model,
                "messages": msgs,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return LLMResponse(
            content=data.get("message", {}).get("content", ""),
            input_tokens=data.get("prompt_eval_count", 0),
            output_tokens=data.get("eval_count", 0),
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
        async with self.client.stream(
            "POST",
            f"{self.base_url}/api/chat",
            json={
                "model": model,
                "messages": msgs,
                "stream": True,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
            },
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line:
                    data = json.loads(line)
                    content = data.get("message", {}).get("content", "")
                    if content:
                        yield content
