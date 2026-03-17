"""任务 API"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from ..database import get_session
from ..models.task import Task
from sqlalchemy import select

router = APIRouter(prefix="/api/tasks", tags=["任务"])


class CreateTaskRequest(BaseModel):
    message: str
    level: Optional[str] = ""


class TaskResponse(BaseModel):
    id: str
    title: str
    state: str
    state_label: str
    level: str
    current_agent: str
    output: str
    bill_content: str
    bill_version: int
    flow_log: list
    progress_log: list
    votes: list
    opinions: list
    draft_rounds: int
    chamber_rounds: int
    total_transitions: int
    created_at: Optional[str]
    updated_at: Optional[str]


@router.get("")
async def list_tasks(limit: int = 20):
    """获取任务列表"""
    async with get_session() as session:
        result = await session.execute(
            select(Task).order_by(Task.created_at.desc()).limit(limit)
        )
        tasks = result.scalars().all()
        return [t.to_dict() for t in tasks]


@router.get("/{task_id}")
async def get_task(task_id: str):
    """获取单个任务详情"""
    async with get_session() as session:
        task = await session.get(Task, task_id)
        if not task:
            raise HTTPException(status_code=404, detail="任务不存在")
        return task.to_dict()


@router.get("/{task_id}/events")
async def get_task_events(task_id: str, limit: int = 100):
    """获取任务的事件历史"""
    from ..services.event_bus import get_event_bus
    bus = get_event_bus()
    return bus.get_history(task_id=task_id, limit=limit)
