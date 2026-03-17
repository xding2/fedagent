"""WebSocket 实时推送 — 驱动前端像素动画"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ..services.event_bus import get_event_bus

logger = logging.getLogger(__name__)
router = APIRouter()

# 活跃的 WebSocket 连接
active_connections: list[WebSocket] = []


async def broadcast_event(event: dict):
    """广播事件到所有 WebSocket 客户端"""
    disconnected = []
    for ws in active_connections:
        try:
            await ws.send_json(event)
        except Exception:
            disconnected.append(ws)
    for ws in disconnected:
        if ws in active_connections:
            active_connections.remove(ws)


@router.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """WebSocket 端点 — 双向通信"""
    await ws.accept()
    active_connections.append(ws)

    # 注册事件监听
    bus = get_event_bus()
    bus.subscribe("*", broadcast_event)

    try:
        while True:
            data = await ws.receive_text()
            try:
                msg = json.loads(data)
                command = msg.get("command", "")
                task_id = msg.get("task_id", "")

                if command and task_id:
                    # 用户干预命令 → 交给 orchestrator 处理
                    # 通过事件总线传递给 orchestrator
                    from ..services.event_bus import Event
                    await bus.publish(Event(
                        type=f"user.{command}",
                        task_id=task_id,
                        data=msg,
                    ))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        if ws in active_connections:
            active_connections.remove(ws)
        logger.info("WebSocket 客户端断开")
