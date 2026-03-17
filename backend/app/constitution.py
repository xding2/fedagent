"""宪法加载器 — 加载 CONSTITUTION.md 作为系统底线规则"""

from pathlib import Path


class Constitution:
    """系统宪法"""

    def __init__(self, path: str = "CONSTITUTION.md"):
        self.path = Path(path)
        self.content = ""
        self.amendments: list[str] = []
        self._load()

    def _load(self):
        if self.path.exists():
            self.content = self.path.read_text(encoding="utf-8")
        else:
            self.content = self._default_constitution()

    def _default_constitution(self) -> str:
        return """# 系统宪法 (System Constitution)

## 第一修正案：用户主权
- 用户的明确指令优先于系统流程
- 用户可以随时干预、跳过、终止任何流程
- 系统不得在用户未知情的情况下做出不可逆操作

## 第二修正案：安全底线
- 不得引入已知安全漏洞
- 敏感信息不得硬编码或明文传输
- 所有外部输入必须验证

## 第三修正案：质量保障
- 输出必须与用户请求相关且有用
- 不得引入已知的破坏性变更
- 已有功能不得在未告知用户的情况下被移除

## 第四修正案：透明度
- 所有决策过程必须可追溯
- Agent 之间的分歧必须如实报告给用户
- 不得隐瞒风险或问题

## 第五修正案：效率
- 简单任务不得被过度流程化
- 系统必须在质量和速度之间取得合理平衡
- 不得无意义地循环或重复工作
"""

    def add_amendment(self, text: str):
        """添加用户自定义修正案"""
        self.amendments.append(text)
        # 追加到文件
        with open(self.path, "a", encoding="utf-8") as f:
            f.write(f"\n## 用户修正案 #{len(self.amendments)}\n- {text}\n")
        self._load()

    def to_prompt(self) -> str:
        """转换为 Agent 可用的 prompt 片段"""
        return f"""## 系统宪法（不可违背的底线规则）
以下是本系统的宪法，你在做任何决策时都必须遵守这些规则。
如果方案违反了以下任何条款，你必须指出。

{self.content}
"""
