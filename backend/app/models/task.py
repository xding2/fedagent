"""
任务模型 + 状态机
12 个状态，严格的转换验证
"""

import enum
import uuid
import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import Column, String, Text, DateTime, Integer, Enum as SAEnum
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class TaskState(str, enum.Enum):
    """任务状态"""
    INTAKE = "intake"                    # 幕僚长接收
    DRAFTING = "drafting"                # 委员会起草
    HOUSE_REVIEW = "house_review"        # 众院审议
    SENATE_REVIEW = "senate_review"      # 参院审查
    CONFERENCE = "conference"            # 两院协商
    PRESIDENT_DESK = "president_desk"    # 总统审批
    EXECUTING = "executing"              # 内阁执行
    EXEC_ORDER = "exec_order"            # 紧急行政令
    JUDICIAL_REVIEW = "judicial_review"  # 违宪审查
    COMPLETED = "completed"              # 完成
    VETOED = "vetoed"                    # 被否决
    BLOCKED = "blocked"                  # 违宪/阻止


class TaskLevel(str, enum.Enum):
    """任务级别"""
    L1 = "L1"  # Quick Response
    L2 = "L2"  # Executive Action
    L3 = "L3"  # Legislative Review
    L4 = "L4"  # Full Constitutional


# 合法状态转换表
VALID_TRANSITIONS: dict[str, list[str]] = {
    "intake":           ["drafting", "president_desk", "exec_order", "completed"],
    "drafting":         ["house_review", "blocked"],
    "house_review":     ["senate_review", "drafting"],
    "senate_review":    ["president_desk", "conference", "drafting"],
    "conference":       ["president_desk"],
    "president_desk":   ["executing", "vetoed"],
    "vetoed":           ["executing", "drafting", "blocked"],
    "exec_order":       ["executing"],
    "executing":        ["judicial_review", "completed"],
    "judicial_review":  ["completed", "blocked"],
    "blocked":          ["drafting", "intake"],
}

# 状态 → 负责的 Agent
STATE_AGENT_MAP: dict[str, str] = {
    "intake":           "chief_of_staff",
    "drafting":         "house_committee",
    "house_review":     "speaker_house",
    "senate_review":    "senate_leader",
    "conference":       "senate_leader",
    "president_desk":   "president",
    "exec_order":       "president",
    "executing":        "sec_operations",  # 默认，orchestrator 会细分
    "judicial_review":  "chief_justice",
    "vetoed":           "speaker_house",   # 评估是否推翻
}

# 状态中文名
STATE_LABELS: dict[str, str] = {
    "intake":           "📥 幕僚长接收",
    "drafting":         "📝 委员会起草",
    "house_review":     "🏛️ 众议院审议",
    "senate_review":    "🔍 参议院审查",
    "conference":       "🤝 两院协商",
    "president_desk":   "🖊️ 总统审批",
    "exec_order":       "⚡ 紧急行政令",
    "executing":        "⚙️ 内阁执行",
    "judicial_review":  "⚖️ 违宪审查",
    "completed":        "✅ 已完成",
    "vetoed":           "❌ 已否决",
    "blocked":          "🚫 已阻止",
}


def validate_transition(current: str, target: str) -> bool:
    """验证状态转换是否合法"""
    allowed = VALID_TRANSITIONS.get(current, [])
    return target in allowed


class Task(Base):
    """任务表"""
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(200), nullable=False)
    description = Column(Text, default="")
    state = Column(String(30), default=TaskState.INTAKE.value, nullable=False)
    level = Column(String(5), default=TaskLevel.L2.value)
    current_agent = Column(String(50), default="chief_of_staff")

    # 会话关联
    conversation_id = Column(String(36), nullable=True)
    message_id = Column(String(36), nullable=True)
    user_selected_level = Column(String(5), default="")
    original_message = Column(Text, default="")

    # 结果
    output = Column(Text, default="")

    # 流程日志 (JSON 数组)
    flow_log = Column(Text, default="[]")       # [{timestamp, from, to, agent, reason}]
    progress_log = Column(Text, default="[]")   # [{timestamp, agent, message}]

    # 法案内容
    bill_content = Column(Text, default="")      # 当前方案内容
    bill_version = Column(Integer, default=0)    # 方案版本号
    amendments = Column(Text, default="[]")      # 修正案列表

    # 投票记录
    votes = Column(Text, default="[]")           # [{agent, vote, reason}]

    # 司法意见
    opinions = Column(Text, default="[]")        # [{agent, opinion, stance}]

    # 计数器 (防死循环)
    draft_rounds = Column(Integer, default=0)    # 起草轮次
    chamber_rounds = Column(Integer, default=0)  # 两院往返次数
    review_count = Column(Integer, default=0)    # 司法审查次数
    total_transitions = Column(Integer, default=0)  # 总转换次数

    # 时间戳
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc),
                        onupdate=lambda: datetime.now(timezone.utc))

    def get_flow_log(self) -> list[dict]:
        return json.loads(self.flow_log or "[]")

    def add_flow_entry(self, from_state: str, to_state: str, agent: str, reason: str = ""):
        log = self.get_flow_log()
        log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "from": from_state,
            "to": to_state,
            "agent": agent,
            "reason": reason,
        })
        self.flow_log = json.dumps(log, ensure_ascii=False)

    def get_progress_log(self) -> list[dict]:
        return json.loads(self.progress_log or "[]")

    def add_progress(self, agent: str, message: str):
        log = self.get_progress_log()
        log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent": agent,
            "message": message,
        })
        self.progress_log = json.dumps(log, ensure_ascii=False)

    def get_votes(self) -> list[dict]:
        return json.loads(self.votes or "[]")

    def add_vote(self, agent: str, vote: str, reason: str = ""):
        votes = self.get_votes()
        votes.append({"agent": agent, "vote": vote, "reason": reason})
        self.votes = json.dumps(votes, ensure_ascii=False)

    def get_opinions(self) -> list[dict]:
        return json.loads(self.opinions or "[]")

    def add_opinion(self, agent: str, opinion: str, stance: str):
        opinions = self.get_opinions()
        opinions.append({"agent": agent, "opinion": opinion, "stance": stance})
        self.opinions = json.dumps(opinions, ensure_ascii=False)

    def transition_to(self, new_state: str, agent: str, reason: str = "") -> bool:
        """执行状态转换 (带验证)"""
        if not validate_transition(self.state, new_state):
            return False

        old_state = self.state
        self.add_flow_entry(old_state, new_state, agent, reason)
        self.state = new_state
        self.current_agent = STATE_AGENT_MAP.get(new_state, agent)
        self.total_transitions += 1
        self.updated_at = datetime.now(timezone.utc)
        return True

    def is_terminal(self) -> bool:
        return self.state in (TaskState.COMPLETED.value, TaskState.BLOCKED.value)

    def is_over_limit(self) -> bool:
        """是否超过总转换上限 (防死循环)"""
        return self.total_transitions >= 15

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "state": self.state,
            "state_label": STATE_LABELS.get(self.state, self.state),
            "level": self.level,
            "current_agent": self.current_agent,
            "output": self.output,
            "bill_content": self.bill_content,
            "bill_version": self.bill_version,
            "flow_log": self.get_flow_log(),
            "progress_log": self.get_progress_log(),
            "votes": self.get_votes(),
            "opinions": self.get_opinions(),
            "draft_rounds": self.draft_rounds,
            "chamber_rounds": self.chamber_rounds,
            "total_transitions": self.total_transitions,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
