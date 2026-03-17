"""会话 API — 多轮对话支持"""

import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

from ..database import get_session
from ..models.conversation import Conversation, Message
from ..models.task import Task
from sqlalchemy import select

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/conversations", tags=["会话"])


class CreateConversationRequest(BaseModel):
    title: Optional[str] = ""


class SendMessageRequest(BaseModel):
    message: str
    level: Optional[str] = "auto"  # "auto" | "L1" | "L2" | "L3" | "L4"


@router.post("")
async def create_conversation(req: CreateConversationRequest):
    """创建新会话"""
    async with get_session() as session:
        conv = Conversation(title=req.title or "新对话")
        session.add(conv)
        await session.commit()
        await session.refresh(conv)
        return conv.to_dict()


@router.get("")
async def list_conversations(limit: int = 50, offset: int = 0):
    """列出会话（最新优先）"""
    async with get_session() as session:
        result = await session.execute(
            select(Conversation)
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(limit)
        )
        conversations = result.scalars().all()

        # 附加每个会话的最后一条消息预览
        conv_list = []
        for conv in conversations:
            conv_dict = conv.to_dict()
            # 获取最后一条消息
            msg_result = await session.execute(
                select(Message)
                .where(Message.conversation_id == conv.id)
                .order_by(Message.created_at.desc())
                .limit(1)
            )
            last_msg = msg_result.scalar_one_or_none()
            conv_dict["last_message"] = last_msg.content[:100] if last_msg else ""
            conv_dict["message_count"] = 0  # 简化，前端不强依赖
            conv_list.append(conv_dict)

        return conv_list


@router.get("/{conversation_id}")
async def get_conversation(conversation_id: str):
    """获取会话及其所有消息"""
    async with get_session() as session:
        conv = await session.get(Conversation, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="会话不存在")

        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        messages = result.scalars().all()

        conv_dict = conv.to_dict()
        conv_dict["messages"] = [m.to_dict() for m in messages]
        return conv_dict


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """删除会话及其消息"""
    async with get_session() as session:
        conv = await session.get(Conversation, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="会话不存在")

        # 删除消息
        msg_result = await session.execute(
            select(Message).where(Message.conversation_id == conversation_id)
        )
        for msg in msg_result.scalars().all():
            await session.delete(msg)

        await session.delete(conv)
        await session.commit()
        return {"ok": True}


@router.post("/{conversation_id}/messages")
async def send_message(conversation_id: str, req: SendMessageRequest, request: Request):
    """在会话中发送消息 — 核心端点"""
    async with get_session() as session:
        conv = await session.get(Conversation, conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="会话不存在")

        # 更新会话标题（首条消息时）
        msg_count_result = await session.execute(
            select(Message).where(Message.conversation_id == conversation_id).limit(1)
        )
        if not msg_count_result.scalar_one_or_none():
            conv.title = req.message[:50]

        # 创建用户消息
        user_msg = Message(
            conversation_id=conversation_id,
            role="user",
            content=req.message,
        )
        session.add(user_msg)
        await session.commit()
        await session.refresh(user_msg)

    # 提交任务给 orchestrator
    orch = request.app.state.orchestrator
    level = req.level if req.level and req.level != "auto" else ""

    task_id = await orch.handle_new_task(
        task_id="",
        message=req.message,
        level=level,
        conversation_id=conversation_id,
        message_id=user_msg.id,
    )

    return {
        "user_message": user_msg.to_dict(),
        "task_id": task_id,
        "message": "消息已发送，正在处理",
    }
