"""
Orchestrator — 三权分立状态机协调器
事件驱动，根据任务级别和当前状态自动调度 Agent
"""

import asyncio
import json
import logging
from typing import Optional

from ..agent_runner import AgentRunner
from ..config import Config
from ..constitution import Constitution
from ..models.task import Task, TaskState, TaskLevel, STATE_LABELS, validate_transition
from ..models.conversation import Conversation, Message
from ..services.event_bus import Event, get_event_bus
from ..database import get_session
from ..triage import TriageEngine

from sqlalchemy import select

logger = logging.getLogger(__name__)


class Orchestrator:
    """三权分立协调器"""

    def __init__(self, config: Config, agent_runner: AgentRunner, constitution: Constitution):
        self.config = config
        self.runner = agent_runner
        self.constitution = constitution
        self.triage = TriageEngine(config.triage)
        self.bus = get_event_bus()

    async def handle_new_task(self, task_id: str, message: str, level: str = "",
                              conversation_id: str = "", message_id: str = ""):
        """处理新任务 — 入口"""
        async with get_session() as session:
            classified_level = level or self.triage.classify(message)
            task = Task(
                title=message[:100],
                description=message,
                level=classified_level,
                original_message=message,
                conversation_id=conversation_id,
                message_id=message_id,
                user_selected_level=level,
            )
            session.add(task)
            await session.commit()
            await session.refresh(task)
            task_id = task.id

            level_info = self.triage.get_level_info(task.level)
            await self.bus.publish(Event(
                type="task.created",
                task_id=task_id,
                data={
                    "title": task.title,
                    "level": task.level,
                    "level_name": level_info["name"],
                    "level_description": level_info["description"],
                },
            ))

            await self._process_intake(task_id, message)
            return task_id

    async def _process_intake(self, task_id: str, message: str):
        """INTAKE 阶段 — 幕僚长分诊"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task:
                return
            await self._publish_progress(task_id, task)

            await self.bus.publish(Event(
                type="task.routed",
                task_id=task_id,
                agent_id="chief_of_staff",
                data={"state": "intake", "level": task.level},
            ))

            if task.level == "L1":
                # L1: 幕僚长直接回答
                result = await self._run_agent_streaming(task_id, "chief_of_staff", message)
                # 重新获取 task (因为 _run_agent_streaming 在另一个 session 中更新了)
                await session.refresh(task)
                task.state = TaskState.COMPLETED.value
                if not task.output:
                    task.output = result
                await session.commit()
                await self.bus.publish(Event(
                    type="task.completed",
                    task_id=task_id,
                    data={"output": task.output},
                ))
                await self._create_assistant_message(task_id)

            elif task.level == "L2":
                # L2: 直接到总统审批
                task.transition_to("president_desk", "chief_of_staff", "L2 行政快速通道")
                await session.commit()
                await self._process_president(task_id)

            elif task.level in ("L3", "L4"):
                # L3/L4: 进入立法流程
                task.transition_to("drafting", "chief_of_staff", f"{task.level} 进入立法流程")
                await session.commit()
                await self._process_drafting(task_id)

    async def _process_drafting(self, task_id: str):
        """DRAFTING — 众院委员会起草方案"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.state != "drafting":
                return

            task.draft_rounds += 1
            task.add_progress("house_committee", "众院委员会开始起草方案...")
            await session.commit()

            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="house_committee",
                data={"state": "drafting", "round": task.draft_rounds},
            ))

            # 委员会起草
            context = {"用户需求": task.description, "当前版本": str(task.bill_version)}
            if task.bill_content:
                context["上一版方案"] = task.bill_content
                context["指示"] = "请根据反馈修改方案"

            result = await self._run_agent_streaming(task_id, "house_committee", task.description, context)
            task = await session.get(Task, task_id)
            task.bill_content = result
            task.bill_version += 1
            task.transition_to("house_review", "house_committee", f"草案 v{task.bill_version} 完成")
            await session.commit()

            await self._process_house_review(task_id)

    async def _process_house_review(self, task_id: str):
        """HOUSE_REVIEW — 众议院审议表决"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.state != "house_review":
                return

            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="speaker_house",
                data={"state": "house_review"},
            ))

            context = {
                "用户需求": task.description,
                "方案内容": task.bill_content,
                "版本": str(task.bill_version),
                "起草轮次": str(task.draft_rounds),
            }
            prompt = "请审阅以下方案并做出表决。回复 JSON: {\"vote\": \"approve\" 或 \"reject\", \"reason\": \"理由\", \"feedback\": \"如果否决，给出修改建议\"}"

            result = await self._run_agent_streaming(task_id, "speaker_house", prompt, context)

            vote_data = self._parse_vote(result)
            task = await session.get(Task, task_id)
            task.add_vote("speaker_house", vote_data["vote"], vote_data["reason"])

            await self.bus.publish(Event(
                type="vote.result",
                task_id=task_id,
                agent_id="speaker_house",
                data={"chamber": "house", "result": vote_data["vote"], "reason": vote_data["reason"]},
            ))

            if vote_data["vote"] == "approve" or task.draft_rounds >= 3:
                task.transition_to("senate_review", "speaker_house", "众院通过")
                await session.commit()
                await self._process_senate_review(task_id)
            else:
                task.transition_to("drafting", "speaker_house", f"众院打回: {vote_data['reason']}")
                await session.commit()
                await self._process_drafting(task_id)

    async def _process_senate_review(self, task_id: str):
        """SENATE_REVIEW — 参议院审查"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.state != "senate_review":
                return

            task.chamber_rounds += 1
            await session.commit()

            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="senate_committee",
                data={"state": "senate_review"},
            ))

            # 参院委员会独立审查
            context = {
                "用户需求": task.description,
                "众院方案": task.bill_content,
                "版本": str(task.bill_version),
            }
            review_prompt = "请独立审查此方案，提出修正意见。回复 JSON: {\"assessment\": \"评估\", \"amendments\": \"修正建议\", \"vote\": \"approve\" 或 \"reject\", \"reason\": \"理由\"}"

            result = await self._run_agent_streaming(task_id, "senate_committee", review_prompt, context)

            # 参院领袖表决
            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="senate_leader",
                data={"state": "senate_review"},
            ))

            leader_context = {
                "用户需求": task.description,
                "众院方案": task.bill_content,
                "参院委员会意见": result,
                "两院往返次数": str(task.chamber_rounds),
            }
            leader_prompt = "综合参院委员会意见，做出最终表决。回复 JSON: {\"vote\": \"approve\" 或 \"reject\", \"reason\": \"理由\", \"final_bill\": \"最终方案(如有修正则含修正内容)\"}"

            leader_result = await self._run_agent_streaming(task_id, "senate_leader", leader_prompt, leader_context)
            vote_data = self._parse_vote(leader_result)

            task = await session.get(Task, task_id)
            task.add_vote("senate_leader", vote_data["vote"], vote_data["reason"])

            if "final_bill" in vote_data and vote_data["final_bill"]:
                task.bill_content = vote_data["final_bill"]
                task.bill_version += 1

            await self.bus.publish(Event(
                type="vote.result",
                task_id=task_id,
                agent_id="senate_leader",
                data={"chamber": "senate", "result": vote_data["vote"], "reason": vote_data["reason"]},
            ))

            if vote_data["vote"] == "approve" or task.chamber_rounds >= 2:
                task.transition_to("president_desk", "senate_leader", "参院通过")
                await session.commit()
                await self._process_president(task_id)
            else:
                task.transition_to("drafting", "senate_leader", f"参院打回: {vote_data['reason']}")
                await session.commit()
                await self._process_drafting(task_id)

    async def _process_president(self, task_id: str):
        """PRESIDENT_DESK — 总统审批"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.state != "president_desk":
                return

            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="president",
                data={"state": "president_desk"},
            ))

            context = {"用户需求": task.description}
            if task.bill_content:
                context["国会方案"] = task.bill_content
                context["方案版本"] = str(task.bill_version)

            if task.level == "L2":
                prompt = "请审批此任务并制定执行计划。直接回复执行方案。"
            else:
                prompt = "请审批国会通过的方案。回复 JSON: {\"decision\": \"sign\" 或 \"veto\", \"reason\": \"理由\", \"execution_plan\": \"如果签署，具体执行计划\"}"

            result = await self._run_agent_streaming(task_id, "president", prompt, context)

            task = await session.get(Task, task_id)

            if task.level == "L2":
                # L2 快速通道: 直接进入执行
                task.bill_content = result
                task.transition_to("executing", "president", "L2 总统直接批准")
                await self.bus.publish(Event(
                    type="bill.signed",
                    task_id=task_id,
                    agent_id="president",
                    data={"decision": "sign"},
                ))
                await session.commit()
                await self._process_executing(task_id)
            else:
                decision_data = self._parse_vote(result, decision_key="decision", approve_val="sign")
                if decision_data["vote"] == "approve":
                    if decision_data.get("execution_plan"):
                        task.bill_content = decision_data["execution_plan"]
                    task.transition_to("executing", "president", "总统签署")
                    await self.bus.publish(Event(
                        type="bill.signed",
                        task_id=task_id,
                        agent_id="president",
                        data={"decision": "sign", "reason": decision_data["reason"]},
                    ))
                    await session.commit()
                    await self._process_executing(task_id)
                else:
                    task.transition_to("vetoed", "president", f"总统否决: {decision_data['reason']}")
                    await self.bus.publish(Event(
                        type="bill.vetoed",
                        task_id=task_id,
                        agent_id="president",
                        data={"reason": decision_data["reason"]},
                    ))
                    await session.commit()
                    await self._process_veto_override(task_id)

    async def _process_veto_override(self, task_id: str):
        """VETOED — 评估是否推翻总统否决"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.state != "vetoed":
                return

            context = {
                "用户需求": task.description,
                "方案内容": task.bill_content,
                "总统否决理由": task.get_flow_log()[-1].get("reason", ""),
            }
            prompt = "总统否决了此方案。请评估是否发起推翻投票。回复 JSON: {\"override\": true 或 false, \"reason\": \"理由\"}"

            result = await self._run_agent_streaming(task_id, "speaker_house", prompt, context)

            task = await session.get(Task, task_id)

            try:
                data = json.loads(self._extract_json(result))
                should_override = data.get("override", False)
            except (json.JSONDecodeError, ValueError):
                should_override = "override" in result.lower() and "true" in result.lower()

            if should_override:
                task.transition_to("executing", "speaker_house", "国会推翻总统否决")
                await self.bus.publish(Event(
                    type="veto.overridden",
                    task_id=task_id,
                    data={"result": "overridden"},
                ))
            else:
                # 打回修改
                task.transition_to("drafting", "speaker_house", "接受否决，修改方案")
            await session.commit()

            if task.state == "executing":
                await self._process_executing(task_id)
            elif task.state == "drafting":
                await self._process_drafting(task_id)

    async def _process_executing(self, task_id: str):
        """EXECUTING — 内阁执行"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.state != "executing":
                return

            # 防死循环检查
            if task.is_over_limit():
                task.output = task.bill_content or "任务因超过转换上限被强制完成"
                task.state = TaskState.COMPLETED.value
                await session.commit()
                await self.bus.publish(Event(
                    type="task.completed",
                    task_id=task_id,
                    data={"output": task.output, "reason": "超过转换上限"},
                ))
                await self._create_assistant_message(task_id)
                return

            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="sec_operations",
                data={"state": "executing"},
            ))

            context = {
                "用户需求": task.description,
                "执行方案": task.bill_content or task.description,
            }
            result = await self._run_agent_streaming(
                task_id, "sec_operations",
                "请根据执行方案完成任务。直接输出最终结果。",
                context,
            )

            task = await session.get(Task, task_id)
            task.output = result

            # L4 需要司法审查
            if task.level == "L4" and task.review_count == 0:
                task.transition_to("judicial_review", "sec_operations", "L4 进入司法审查")
                await session.commit()
                await self._process_judicial_review(task_id)
            else:
                task.state = TaskState.COMPLETED.value
                task.add_flow_entry("executing", "completed", "sec_operations", "执行完成")
                await session.commit()
                await self.bus.publish(Event(
                    type="task.completed",
                    task_id=task_id,
                    data={"output": task.output},
                ))
                await self._create_assistant_message(task_id)

    async def _process_judicial_review(self, task_id: str):
        """JUDICIAL_REVIEW — 违宪审查"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.state != "judicial_review":
                return

            task.review_count += 1
            await session.commit()

            constitution_text = self.constitution.to_prompt()

            # 进步派大法官
            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="justice_progressive",
                data={"state": "judicial_review"},
            ))

            prog_context = {
                "宪法": constitution_text,
                "方案": task.bill_content or task.output,
                "执行结果": task.output,
            }
            prog_result = await self._run_agent_streaming(
                task_id, "justice_progressive",
                "请从创新和灵活性角度评估此方案是否违反系统宪法。回复 JSON: {\"stance\": \"constitutional\" 或 \"unconstitutional\", \"opinion\": \"意见\"}",
                prog_context,
            )

            # 保守派大法官 (并行的话更好，这里简化为串行)
            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="justice_originalist",
                data={"state": "judicial_review"},
            ))

            orig_result = await self._run_agent_streaming(
                task_id, "justice_originalist",
                "请从稳定性和安全性角度评估此方案是否违反系统宪法。回复 JSON: {\"stance\": \"constitutional\" 或 \"unconstitutional\", \"opinion\": \"意见\"}",
                prog_context,
            )

            # 首席大法官综合判决
            await self.bus.publish(Event(
                type="agent.thinking.start",
                task_id=task_id,
                agent_id="chief_justice",
                data={"state": "judicial_review"},
            ))

            cj_context = {
                "宪法": constitution_text,
                "方案": task.bill_content or task.output,
                "进步派意见": prog_result,
                "保守派意见": orig_result,
            }
            cj_result = await self._run_agent_streaming(
                task_id, "chief_justice",
                "综合两位大法官的意见，做出最终判决。回复 JSON: {\"ruling\": \"constitutional\" 或 \"unconstitutional\", \"majority_opinion\": \"多数意见\", \"dissent\": \"少数意见\", \"suggestion\": \"如违宪，修改建议\"}",
                cj_context,
            )

            task = await session.get(Task, task_id)

            try:
                ruling_data = json.loads(self._extract_json(cj_result))
                ruling = ruling_data.get("ruling", "constitutional")
            except (json.JSONDecodeError, ValueError):
                ruling = "constitutional" if "constitutional" in cj_result.lower() and "unconstitutional" not in cj_result.lower() else "unconstitutional"
                ruling_data = {"ruling": ruling, "majority_opinion": cj_result}

            await self.bus.publish(Event(
                type="judicial.ruling",
                task_id=task_id,
                agent_id="chief_justice",
                data=ruling_data,
            ))

            if ruling == "constitutional":
                task.state = TaskState.COMPLETED.value
                task.add_flow_entry("judicial_review", "completed", "chief_justice", "合宪，任务完成")
                await session.commit()
                await self.bus.publish(Event(
                    type="task.completed",
                    task_id=task_id,
                    data={"output": task.output},
                ))
                await self._create_assistant_message(task_id)
            else:
                task.transition_to("blocked", "chief_justice",
                                   f"违宪: {ruling_data.get('majority_opinion', '')[:200]}")
                if task.review_count < 2:
                    task.transition_to("drafting", "chief_justice", "违宪，返回重新起草")
                await session.commit()

                if task.state == "drafting":
                    await self._process_drafting(task_id)

    # ────────── 用户干预命令 ──────────

    async def user_fast(self, task_id: str):
        """用户 /fast — 降级到 L2"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.is_terminal():
                return
            task.level = "L2"
            old_state = task.state
            if old_state not in ("executing", "completed"):
                task.state = "president_desk"
                task.current_agent = "president"
                task.add_flow_entry(old_state, "president_desk", "user", "/fast 用户强制降级")
            await session.commit()

        await self.bus.publish(Event(type="user.fast", task_id=task_id))

        if task.state == "president_desk":
            await self._process_president(task_id)

    async def user_skip(self, task_id: str):
        """用户 /skip — 跳过当前阶段"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or task.is_terminal():
                return

            skip_map = {
                "drafting": "house_review",
                "house_review": "senate_review",
                "senate_review": "president_desk",
                "president_desk": "executing",
                "judicial_review": "completed",
            }
            next_state = skip_map.get(task.state)
            if next_state:
                task.add_flow_entry(task.state, next_state, "user", "/skip 用户跳过")
                task.state = next_state
                await session.commit()

        await self.bus.publish(Event(type="user.skip", task_id=task_id))

    async def user_stop(self, task_id: str):
        """用户 /stop — 终止任务"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task:
                return
            task.add_flow_entry(task.state, "completed", "user", "/stop 用户终止")
            task.state = TaskState.COMPLETED.value
            task.output = task.output or task.bill_content or "任务被用户终止"
            await session.commit()

        await self.bus.publish(Event(type="user.stop", task_id=task_id))
        await self.bus.publish(Event(type="task.completed", task_id=task_id, data={"output": "任务被终止"}))
        await self._create_assistant_message(task_id)

    # ────────── 响应格式化 ──────────

    async def _create_assistant_message(self, task_id: str):
        """任务完成后创建格式化的 assistant 消息"""
        async with get_session() as session:
            task = await session.get(Task, task_id)
            if not task or not task.conversation_id:
                return

            formatted = self._format_response(task)

            msg = Message(
                conversation_id=task.conversation_id,
                role="assistant",
                content=formatted,
                task_id=task_id,
            )
            msg.set_metadata({
                "level": task.level,
                "level_label": self.triage.get_level_info(task.level).get("name", task.level),
                "state": task.state,
                "total_transitions": task.total_transitions,
                "flow_log": task.get_flow_log(),
                "votes": task.get_votes(),
            })
            session.add(msg)

            # 更新会话时间
            conv = await session.get(Conversation, task.conversation_id)
            if conv:
                from datetime import datetime, timezone
                conv.updated_at = datetime.now(timezone.utc)

            await session.commit()
            await session.refresh(msg)

            await self.bus.publish(Event(
                type="message.created",
                task_id=task_id,
                data={
                    "conversation_id": task.conversation_id,
                    "message": msg.to_dict(),
                },
            ))

    def _format_response(self, task: Task) -> str:
        """将 task 结果转为用户友好的 markdown 文本"""
        output = self._extract_content(task.output or "")

        # L1 直接返回
        if task.level == "L1":
            return output

        parts = []

        # 主要结果
        if output:
            parts.append(output)

        # 投票摘要
        votes = task.get_votes()
        if votes:
            vote_lines = []
            for v in votes:
                agent_name = v.get("agent", "")
                vote_val = "通过" if v.get("vote") == "approve" else "否决"
                reason = v.get("reason", "")
                vote_lines.append(f"- **{agent_name}**: {vote_val}" + (f" — {reason[:80]}" if reason else ""))
            if vote_lines:
                parts.append("\n---\n**投票记录:**\n" + "\n".join(vote_lines))

        # 司法意见
        opinions = task.get_opinions()
        if opinions:
            opinion_lines = []
            for o in opinions:
                opinion_lines.append(f"- **{o.get('agent', '')}** ({o.get('stance', '')}): {o.get('opinion', '')[:100]}")
            if opinion_lines:
                parts.append("\n**司法意见:**\n" + "\n".join(opinion_lines))

        return "\n\n".join(parts) if parts else output

    @staticmethod
    def _extract_content(text: str) -> str:
        """从 Agent 输出中提取人类可读内容，去掉 JSON 包装。
        Agent 可能返回各种 JSON 格式：
        - {"direct_response": "..."}
        - {"deliverables": [{"content": "..."}]}
        - {"result": "...", "execution_plan": "..."}
        - 纯文本
        - ```json ... ``` 包裹
        """
        if not text:
            return text

        # 尝试解析为 JSON
        try:
            json_str = text.strip()
            # 处理 markdown 代码块包裹的 JSON (```json ... ```)
            # 兼容各种变体：```json、``` json、```\n{
            import re
            json_str = re.sub(r'^```\s*(?:json)?\s*\n?', '', json_str)
            json_str = re.sub(r'\n?```\s*$', '', json_str)
            json_str = json_str.strip()

            # 尝试找 {...} 区间（Agent 可能前后加了文字）
            start = json_str.find("{")
            end = json_str.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = json_str[start:end]

            data = json.loads(json_str)
            if not isinstance(data, dict):
                return text

            # 收集所有可读内容
            content_parts = []

            # 1. 顶层回复字段
            for key in ("direct_response", "response", "answer",
                        "execution_plan", "final_bill", "final_response",
                        "majority_opinion", "summary", "conclusion"):
                val = data.get(key)
                if val and isinstance(val, str) and len(val) > 5:
                    content_parts.append(val)

            # 2. deliverables 数组（常见于执行结果）
            deliverables = data.get("deliverables", [])
            if isinstance(deliverables, list):
                for d in deliverables:
                    if isinstance(d, dict):
                        c = d.get("content", "")
                        if c and isinstance(c, str) and len(c) > 5:
                            content_parts.append(c)

            # 3. result/output（可能是字符串或嵌套对象）
            for key in ("result", "output", "content"):
                val = data.get(key)
                if val and isinstance(val, str) and len(val) > 5:
                    content_parts.append(val)
                elif val and isinstance(val, dict):
                    # 递归一层
                    for sub_key in ("content", "text", "response", "summary"):
                        sub_val = val.get(sub_key)
                        if sub_val and isinstance(sub_val, str):
                            content_parts.append(sub_val)

            # 4. assessment（参院审查等）
            assessment = data.get("assessment", "")
            if assessment and isinstance(assessment, str) and len(assessment) > 10:
                content_parts.append(assessment)

            # 5. reasoning 作为最后兜底
            if not content_parts:
                reasoning = data.get("reasoning", "")
                if reasoning and isinstance(reasoning, str):
                    content_parts.append(reasoning)

            if content_parts:
                # 去重并合并
                seen = set()
                unique = []
                for p in content_parts:
                    if p not in seen:
                        seen.add(p)
                        unique.append(p)
                return "\n\n".join(unique)

        except (json.JSONDecodeError, ValueError):
            pass

        # 如果不是 JSON 或解析失败，返回原文
        return text

    # ────────── 进度推送 ──────────

    PROGRESS_MAP = {
        "L1": {"intake": 50, "completed": 100},
        "L2": {"intake": 20, "president_desk": 50, "executing": 80, "completed": 100},
        "L3": {"intake": 10, "drafting": 25, "house_review": 40, "senate_review": 55,
                "president_desk": 70, "executing": 85, "completed": 100},
        "L4": {"intake": 10, "drafting": 20, "house_review": 35, "senate_review": 50,
                "president_desk": 65, "executing": 78, "judicial_review": 90, "completed": 100},
    }

    async def _publish_progress(self, task_id: str, task: Task):
        """发布任务进度事件"""
        progress_map = self.PROGRESS_MAP.get(task.level, self.PROGRESS_MAP["L2"])
        pct = progress_map.get(task.state, 0)
        await self.bus.publish(Event(
            type="task.progress",
            task_id=task_id,
            data={
                "state": task.state,
                "state_label": STATE_LABELS.get(task.state, task.state),
                "progress_pct": pct,
                "current_agent": task.current_agent,
                "level": task.level,
            },
        ))

    # ────────── 工具方法 ──────────

    async def _run_agent_streaming(
        self, task_id: str, agent_id: str, message: str,
        context: Optional[dict] = None,
    ) -> str:
        """运行 Agent 并流式推送思考过程到前端"""
        bus = self.bus

        async def on_chunk(chunk: str):
            await bus.publish(Event(
                type="agent.thinking.chunk",
                task_id=task_id,
                agent_id=agent_id,
                data={"chunk": chunk},
            ))

        try:
            result = await self.runner.run_streaming(
                agent_id=agent_id,
                message=message,
                context=context,
                on_chunk=on_chunk,
            )
            content = result.content

            await bus.publish(Event(
                type="agent.thinking.end",
                task_id=task_id,
                agent_id=agent_id,
                data={"content": content[:500]},
            ))

            # 更新任务输出
            async with get_session() as session:
                task = await session.get(Task, task_id)
                if task:
                    task.output = content
                    task.add_progress(agent_id, content[:200])
                    await session.commit()
                    await self._publish_progress(task_id, task)

            return content

        except Exception as e:
            logger.error(f"Agent {agent_id} 调用失败: {e}")
            await bus.publish(Event(
                type="agent.thinking.end",
                task_id=task_id,
                agent_id=agent_id,
                data={"error": str(e)},
            ))
            return f"[Agent {agent_id} 错误: {e}]"

    def _parse_vote(self, text: str, decision_key: str = "vote", approve_val: str = "approve") -> dict:
        """从 Agent 回复中解析投票/决策 JSON"""
        try:
            json_str = self._extract_json(text)
            data = json.loads(json_str)
            vote = data.get(decision_key, "")
            if vote == approve_val or vote == "sign":
                data["vote"] = "approve"
            else:
                data["vote"] = "reject"
            return data
        except (json.JSONDecodeError, ValueError):
            # 模糊匹配
            text_lower = text.lower()
            if any(w in text_lower for w in ["approve", "sign", "通过", "批准", "签署", "同意"]):
                return {"vote": "approve", "reason": text[:200]}
            return {"vote": "reject", "reason": text[:200]}

    @staticmethod
    def _extract_json(text: str) -> str:
        """从文本中提取 JSON 字符串"""
        # 尝试找 {...}
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return text[start:end]
        return text
