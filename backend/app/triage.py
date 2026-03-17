"""
自适应分级引擎 (Triage)
根据用户请求内容自动判断任务级别: L1 / L2 / L3 / L4
"""

from .config import TriageConfig


class TriageEngine:
    """自适应分级引擎"""

    def __init__(self, config: TriageConfig):
        self.config = config

    def classify(self, message: str, explicit_level: str = "") -> str:
        """判断任务级别

        Args:
            message: 用户输入
            explicit_level: 用户显式指定的级别 (--level L3)

        Returns:
            "L1" / "L2" / "L3" / "L4"
        """
        # 用户显式指定 → 最高优先级
        if explicit_level and explicit_level in ("L1", "L2", "L3", "L4"):
            return explicit_level

        msg = message.strip()

        # L1: 简单问答 (短消息 + 包含关键词)
        if len(msg) < 20:
            for kw in self.config.l1_keywords:
                if kw in msg:
                    return "L1"
            # 很短的纯疑问句
            if msg.endswith("？") or msg.endswith("?"):
                return "L1"

        # L4: 高风险关键词
        l4_score = sum(1 for kw in self.config.l4_keywords if kw in msg)
        if l4_score >= 2:
            return "L4"

        # L3: 中等复杂度信号
        l3_signals = [
            len(msg) > 100,                    # 长消息 = 复杂需求
            "方案" in msg or "设计" in msg,     # 需要设计
            "重构" in msg or "优化" in msg,     # 需要审查
            "多个" in msg or "多种" in msg,     # 多方案选择
            msg.count("，") >= 3,              # 多条件
            msg.count("\n") >= 2,              # 多行
        ]
        if sum(l3_signals) >= 2:
            return "L3"

        # 默认 L2
        return self.config.default_level

    def get_level_info(self, level: str) -> dict:
        """获取级别的中文说明"""
        info = {
            "L1": {
                "name": "快速回复",
                "description": "简单问答，幕僚长直接处理",
                "branches": ["行政"],
                "estimated_time": "即时",
            },
            "L2": {
                "name": "行政处理",
                "description": "明确任务，总统审批后内阁执行",
                "branches": ["行政"],
                "estimated_time": "快速",
            },
            "L3": {
                "name": "立法审查",
                "description": "复杂任务，国会起草审查后总统批准",
                "branches": ["立法", "行政"],
                "estimated_time": "中等",
            },
            "L4": {
                "name": "三权会审",
                "description": "关键任务，三权分立全流程制衡",
                "branches": ["立法", "行政", "司法"],
                "estimated_time": "充分",
            },
        }
        return info.get(level, info["L2"])
