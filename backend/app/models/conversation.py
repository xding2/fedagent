"""
会话模型 — 支持多轮对话
"""

import uuid
import json
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from .task import Base


class Conversation(Base):
    """会话表"""
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), default="新对话")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Message(Base):
    """消息表"""
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" | "assistant" | "system"
    content = Column(Text, default="")
    task_id = Column(String(36), nullable=True)  # 关联的 task
    metadata_json = Column(Text, default="{}")  # JSON: agent info, level, process summary
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def get_metadata(self) -> dict:
        try:
            return json.loads(self.metadata_json or "{}")
        except json.JSONDecodeError:
            return {}

    def set_metadata(self, data: dict):
        self.metadata_json = json.dumps(data, ensure_ascii=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "role": self.role,
            "content": self.content,
            "task_id": self.task_id,
            "metadata": self.get_metadata(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
