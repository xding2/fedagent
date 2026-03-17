<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PixiJS-8-E91E63?style=flat-square&logo=pixijs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<h1 align="center">🏛️ FedAgent — 三权分立多 Agent 协作系统</h1>

<p align="center">
  <strong>以美国联邦政府三权分立体制为隐喻，构建的多 AI Agent 协作框架</strong>
</p>

<p align="center">
  <a href="#-特性">特性</a> •
  <a href="#-架构">架构</a> •
  <a href="#-快速开始">快速开始</a> •
  <a href="#-任务级别">任务级别</a> •
  <a href="#-宪法系统">宪法系统</a> •
  <a href="./README.md">📖 English</a>
</p>

---

## 🌟 简介

**FedAgent** 将美国联邦政府的三权分立体制映射为 AI Agent 协作架构。16 个 AI Agent 分布在行政、立法、司法三大分支中，通过制衡机制协作处理用户请求，确保输出质量、安全性和透明度。

> 你的每一个问题都会像一项法案一样，经过提案、审议、投票、签署（甚至违宪审查）的完整流程。

### 为什么叫 FedAgent？

**Fed** = Federal（联邦），**Agent** = AI Agent。正如美国联邦政府通过三权分立实现权力制衡，FedAgent 让多个 AI Agent 通过相互审查来确保输出质量：

- **总统**起草方案，但需要**国会**投票通过
- **国会**通过的法案，**总统**可以否决
- 最终结果还可能被**最高法院**裁定违宪
- 每一步都有完整的审计日志，对用户完全透明

这不是一个 Agent 说了算，而是**多个 Agent 相互制衡**的协作系统。

---

## ✨ 特性

### 🏗️ 三权分立架构

| 分支 | 建筑 | Agent 数量 | 职能 |
|:----:|:----:|:---------:|:-----|
| 🏛️ **行政分支** | 白宫 | 7 | 总统、幕僚长、战略/研究/执行/质量四部部长、总检察长 — 提案起草与执行 |
| 🏛️ **立法分支** | 国会大厦 | 5 | 众议院议长、参议院领袖、两院委员会、预算办公室 — 审议与投票 |
| ⚖️ **司法分支** | 最高法院 | 3 | 首席大法官、进步派大法官、保守派大法官 — 违宪审查 |
| 📢 **新闻发布** | 新闻发布厅 | 1 | 新闻秘书 — 结果发布与公众沟通 |

### 🎮 像素世界实时可视化

- 基于 **PixiJS 8** 的程序化像素艺术渲染（纯代码生成，无精灵图）
- 实时展示 Agent 思考、投票、文件传递动画
- 支持鼠标滚轮缩放 (0.5x–3x) 和拖拽平移
- 高 DPI 屏幕自适应

### 💬 多轮对话

- 完整的会话管理（创建、切换、删除历史对话）
- 流式实时回复显示
- Markdown 格式化渲染（标题、加粗、代码块、列表、表格）
- 每条消息可展开查看处理详情（流程轨迹、投票记录）

### 🌐 中英双语界面

- 工具栏一键切换中文 / English
- 所有 UI 文本、Agent 名称、状态标签完整翻译

### 🔒 宪法约束系统

- 五大修正案：用户主权、安全底线、质量保障、透明度、效率
- 司法分支可对任务结果进行违宪审查，推翻不合规的输出
- 用户可通过 `/amend` 命令自定义宪法条款

---

## 🏗️ 架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端 (React + PixiJS)                     │
│  ┌──────────┐  ┌───────────────────────┐  ┌──────────────┐ │
│  │ 会话列表  │  │ 像素世界 + 聊天面板    │  │ Agent 监控   │ │
│  └──────────┘  └───────────────────────┘  └──────────────┘ │
│                         │ WebSocket                         │
├─────────────────────────┼───────────────────────────────────┤
│                    后端 (FastAPI)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ REST API    │  │ 事件总线     │  │ 状态机编排器      │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
│                                           │                 │
│  ┌────────────────────────────────────────┼───────────┐    │
│  │              16 个 AI Agent            │           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┴─────┐    │    │
│  │  │ 行政分支  │  │ 立法分支  │  │  司法分支    │    │    │
│  │  │ 7 agents │  │ 5 agents │  │  3 agents    │    │    │
│  │  └──────────┘  └──────────┘  └──────────────┘    │    │
│  └───────────────────────────────────────────────────┘    │
│                         │ LLM API                          │
│                    ┌────┴────┐                              │
│                    │ OpenAI  │                              │
│                    │ GPT-4o  │                              │
│                    └─────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

### 状态机流转

一个任务从接收到完成的完整生命周期：

```
接收(intake) → 起草(drafting) → 众院审议 → 参院审议 → 总统审批
    │                                                    │
    │   ┌─── 否决(vetoed) ← ─── ─── ─── ─── ─── ─── ───┘
    │   │        │
    │   │   推翻投票(override)
    │   │        │
    │   └────────┴──→ 执行(executing) → 违宪审查 → 生效(enacted)
    │                                      │
    └──→ L1/L2 快速通道 ──→ 完成           └──→ 违宪 / 搁置
```

**核心规则：**
- 最多 15 次状态转换，防止无限循环
- 每次转换都有完整审计日志
- 用户可随时介入（快速通道、跳过、终止）

---

## 🚀 快速开始

### 环境要求

- Python 3.11+
- Node.js 18+
- OpenAI API Key（支持 GPT-4o）

### 1. 克隆仓库

```bash
git clone https://github.com/xding2/fedagent.git
cd fedagent
```

### 2. 配置 API Key

**推荐方式 — 使用 .env 文件（不会被提交到 Git）：**

```bash
# 创建 .env 文件
echo "OPENAI_API_KEY=sk-你的密钥" > .env

# 复制配置模板
cp config.yaml.example config.yaml
```

也支持其他 LLM 提供商：DeepSeek、硅基流动、OpenRouter、Anthropic、Ollama 等。

### 3. 一键启动

```bash
# Windows
start.bat

# Windows PowerShell
powershell -ExecutionPolicy Bypass -File start.ps1

# Linux / macOS
./start.sh
```

首次运行时，启动脚本会引导你选择 LLM 提供商和输入 API Key。

**手动启动：**

```bash
# 后端
pip install -r requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000

# 前端（新开一个终端）
cd frontend
npm install
npm run dev
```

### 4. 访问

打开浏览器访问：**http://localhost:5173**

---

## 📊 任务级别

FedAgent 根据任务复杂度提供四种处理级别，你可以手动选择或让 AI 自动判断：

| 级别 | 名称 | 处理流程 | 参考耗时 | 适用场景 |
|:----:|:----:|:--------|:-------:|:--------|
| ⚡ **L1** | 快速回复 | 幕僚长直接回答，不经过任何审批 | ~5秒 | 简单问答、闲聊、解释概念 |
| 🔵 **L2** | 行政审批 | 总统审批 → 分配部长执行 → 总统签署 | ~15秒 | 常规任务、代码生成、文本编写 |
| 🟣 **L3** | 立法审议 | 起草法案 → 众院审议 → 参院审议 → 总统签署 | ~45秒 | 复杂决策、方案设计、架构规划 |
| 🔴 **L4** | 全面审查 | L3 完整流程 + 最高法院三位大法官违宪审查 | ~60秒 | 高风险操作、安全审计、生产部署 |

在聊天输入框左侧的下拉菜单中选择级别，默认为 **自动（Auto）**。

---

## ⚖️ 宪法系统

系统内置五大修正案，作为所有 Agent 行为的最高准则。司法分支在 L4 级别任务中会依据宪法进行违宪审查：

### 第一修正案：用户主权
用户的明确指令优先于系统流程。用户可以随时干预、跳过、终止任何流程。

### 第二修正案：安全底线
不得引入已知安全漏洞。敏感信息不得硬编码或明文传输。所有外部输入必须验证和清理。

### 第三修正案：质量保障
输出必须与用户请求相关且有用。不得引入已知的性能退化或破坏性变更。

### 第四修正案：透明度
所有决策过程必须可追溯（完整审计日志）。Agent 之间的分歧必须如实报告给用户。

### 第五修正案：效率
简单任务不得被过度流程化。系统必须在质量和速度之间取得合理平衡。

用户可通过 `/amend` 命令添加自定义宪法条款，例如：
- `/amend "所有代码必须有单元测试覆盖"`
- `/amend "输出语言必须为中文"`

详见 [`CONSTITUTION.md`](./CONSTITUTION.md)。

---

## 🛠️ 技术栈

| 层级 | 技术 |
|:----:|:-----|
| 前端 | React 18, TypeScript 5, Vite 6, TailwindCSS 3, PixiJS 8, Zustand 5 |
| 后端 | Python 3.11, FastAPI, SQLAlchemy (异步 SQLite), WebSocket |
| AI 模型 | OpenAI GPT-4o（核心 Agent）, GPT-4o-mini（辅助 Agent） |
| 可视化 | PixiJS 程序化像素艺术（纯代码渲染，无外部素材） |
| 状态管理 | Zustand（前端）, 有限状态机 FSM（后端编排器） |

---

## 📁 项目结构

```
fedagent/
├── backend/
│   ├── app/
│   │   ├── api/              # REST API 路由
│   │   │   ├── conversations.py  # 会话 CRUD + 消息
│   │   │   └── tasks.py         # 任务提交/控制
│   │   ├── models/           # SQLAlchemy 数据模型
│   │   │   ├── task.py          # 任务模型（状态机）
│   │   │   └── conversation.py  # 会话/消息模型
│   │   ├── services/         # 服务层
│   │   │   └── event_bus.py     # WebSocket 事件总线
│   │   ├── workers/          # 核心工作器
│   │   │   └── orchestrator.py  # 状态机编排器（12 状态 × 15 最大转换）
│   │   ├── providers/        # LLM 提供商适配器
│   │   │   ├── openai_provider.py   # OpenAI / 兼容 API
│   │   │   └── anthropic_provider.py # Anthropic Claude
│   │   ├── config.py         # 配置系统（支持环境变量）
│   │   ├── database.py       # 数据库初始化
│   │   └── main.py           # FastAPI 入口
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/       # React 组件
│   │   │   ├── ChatPanel.tsx    # 聊天消息面板（Markdown 渲染）
│   │   │   ├── ChatInput.tsx    # 输入框 + 级别选择器
│   │   │   ├── PixiCanvas.tsx   # 像素世界画布（缩放/平移）
│   │   │   ├── ConversationSidebar.tsx  # 会话列表侧栏
│   │   │   ├── ThinkingPanel.tsx # Agent 思考状态监控
│   │   │   ├── VoteBoard.tsx    # 投票记录面板
│   │   │   └── OnboardingModal.tsx # 新用户引导
│   │   ├── engine/           # PixiJS 像素渲染引擎
│   │   │   ├── PixiApp.ts      # 应用初始化 + 缩放控制
│   │   │   ├── AgentRenderer.ts # Agent 角色渲染
│   │   │   └── BuildingRenderer.ts # 建筑渲染
│   │   ├── stores/           # Zustand 状态管理
│   │   │   ├── conversationStore.ts  # 会话/消息/流式回复
│   │   │   ├── agentStore.ts   # Agent 状态
│   │   │   ├── taskStore.ts    # 任务状态
│   │   │   └── uiStore.ts     # UI 状态（语言/面板/Toast）
│   │   ├── hooks/            # 自定义 Hooks
│   │   │   ├── useWebSocket.ts  # WebSocket 连接管理
│   │   │   └── useAgentEvents.ts # Agent 事件处理
│   │   └── i18n.ts           # 国际化（中/英双语）
│   └── ...
├── agents/                   # 16 个 Agent 的提示词定义
├── CONSTITUTION.md           # 系统宪法（五大修正案）
├── config.yaml.example       # 配置模板（不含密钥）
├── .env                      # API 密钥（不提交到 Git）
├── start.sh / start.ps1 / start.bat  # 一键启动脚本
└── docker-compose.yml        # Docker 部署
```

---

## 🐳 Docker 部署

```bash
docker-compose up -d
```

访问：**http://localhost:8000**

---

## 📄 许可证

MIT

---

<p align="center">
  <strong>🏛️ FedAgent</strong> — <em>AI with Checks and Balances</em><br/>
  <sub>让 AI 也有三权分立</sub>
</p>
