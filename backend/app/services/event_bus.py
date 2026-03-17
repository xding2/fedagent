"""
事件总线 — 内存版 (零依赖，开箱即用)
支持发布/订阅，驱动前端可视化动画
"""

import asyncio
import logging
from datetime import datetime, timezone
from typing import Callable, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class Event:
    """事件"""
    type: str                   # 事件类型 (如 "agent.thinking.chunk")
    task_id: str = ""           # 关联任务 ID
    agent_id: str = ""          # 关联 Agent ID
    data: dict = field(default_factory=dict)  # 事件数据
    timestamp: str = ""         # ISO 时间戳

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> dict:
        return {
            "type": self.type,
            "task_id": self.task_id,
            "agent_id": self.agent_id,
            "agent": self.agent_id,  # 前端用 agent 字段
            "data": self.data,
            "timestamp": self.timestamp,
        }


class MemoryEventBus:
    """内存事件总线 (开发模式，无需 Redis)"""

    def __init__(self):
        self._subscribers: dict[str, list[Callable]] = {}
        self._wildcard_subscribers: list[Callable] = []
        self._history: list[Event] = []
        self._max_history = 1000

    async def publish(self, event: Event):
        """发布事件"""
        self._history.append(event)
        if len(self._history) > self._max_history:
            self._history = self._history[-self._max_history:]

        # 通知特定类型的订阅者
        for callback in self._subscribers.get(event.type, []):
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event.to_dict())
                else:
                    callback(event.to_dict())
            except Exception as e:
                logger.error(f"事件回调错误 [{event.type}]: {e}")

        # 通知通配符订阅者
        for callback in self._wildcard_subscribers:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(event.to_dict())
                else:
                    callback(event.to_dict())
            except Exception as e:
                logger.error(f"通配符回调错误: {e}")

    def subscribe(self, event_type: str, callback: Callable):
        """订阅事件"""
        if event_type == "*":
            self._wildcard_subscribers.append(callback)
        else:
            if event_type not in self._subscribers:
                self._subscribers[event_type] = []
            self._subscribers[event_type].append(callback)

    def unsubscribe(self, event_type: str, callback: Callable):
        """取消订阅"""
        if event_type == "*":
            if callback in self._wildcard_subscribers:
                self._wildcard_subscribers.remove(callback)
        elif event_type in self._subscribers:
            if callback in self._subscribers[event_type]:
                self._subscribers[event_type].remove(callback)

    def get_history(self, task_id: str = "", limit: int = 50) -> list[dict]:
        """获取事件历史"""
        events = self._history
        if task_id:
            events = [e for e in events if e.task_id == task_id]
        return [e.to_dict() for e in events[-limit:]]


# 全局单例
_event_bus: Optional[MemoryEventBus] = None


def get_event_bus() -> MemoryEventBus:
    global _event_bus
    if _event_bus is None:
        _event_bus = MemoryEventBus()
    return _event_bus
