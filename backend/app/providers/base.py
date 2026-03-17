"""LLM 提供商基类"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncIterator


@dataclass
class LLMResponse:
    """LLM 响应"""
    content: str
    input_tokens: int = 0
    output_tokens: int = 0
    model: str = ""


class BaseLLMProvider(ABC):
    """LLM 提供商抽象基类"""

    @abstractmethod
    async def chat(
        self,
        model: str,
        system: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> LLMResponse:
        """同步调用"""
        ...

    @abstractmethod
    async def stream(
        self,
        model: str,
        system: str,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """流式调用 - yield 每个 token/chunk"""
        ...
