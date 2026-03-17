<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/PixiJS-8-E91E63?style=flat-square&logo=pixijs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" />
</p>

<h1 align="center">🏛️ FedAgent — 三权分立多 Agent 协作系统</h1>
<h3 align="center">Separation-of-Powers Multi-Agent Collaboration System</h3>

<p align="center">
  <strong>以美国联邦政府三权分立体制为隐喻，构建的多 AI Agent 协作框架</strong><br/>
  <em>A multi-AI-agent collaboration framework modeled after the U.S. federal government's separation of powers</em>
</p>

<p align="center">
  <a href="#-特性--features">特性 Features</a> •
  <a href="#-架构--architecture">架构 Architecture</a> •
  <a href="#-快速开始--quick-start">快速开始 Quick Start</a> •
  <a href="#-任务级别--task-levels">任务级别 Task Levels</a> •
  <a href="#-宪法系统--constitution">宪法 Constitution</a>
</p>

---

## 🌟 简介 | Introduction

**FedAgent** 将美国联邦政府的三权分立体制映射为 AI Agent 协作架构。16 个 AI Agent 分布在行政、立法、司法三大分支中，通过制衡机制协作处理用户请求，确保输出质量、安全性和透明度。

**FedAgent** maps the U.S. federal government's separation of powers onto an AI agent collaboration architecture. 16 AI agents are distributed across the Executive, Legislative, and Judicial branches, collaborating through checks-and-balances mechanisms to ensure output quality, safety, and transparency.

> 你的每一个问题都会像一项法案一样，经过提案、审议、投票、签署（甚至违宪审查）的完整流程。
>
> Every question you ask goes through a complete legislative process — drafting, deliberation, voting, signing (and even constitutional review).

---

## ✨ 特性 | Features

### 🏗️ 三权分立架构 | Separation of Powers Architecture

| 分支 Branch | 建筑 Building | Agent 数量 | 职能 Role |
|:-----------:|:-------------:|:---------:|:---------|
| 🏛️ **行政 Executive** | 白宫 White House | 7 | 总统、幕僚长、四部部长、总检察长 — 提案起草与执行 |
| 🏛️ **立法 Legislative** | 国会大厦 Capitol | 5 | 众议院议长、参议院领袖、两院委员会、预算办 — 审议与投票 |
| ⚖️ **司法 Judicial** | 最高法院 Supreme Court | 3 | 首席大法官、进步派/保守派大法官 — 违宪审查 |
| 📢 **新闻 Press** | 新闻发布厅 Press Room | 1 | 新闻秘书 — 结果发布 |

### 🎮 像素世界实时可视化 | Pixel World Real-Time Visualization

- 基于 **PixiJS 8** 的程序化像素艺术渲染（纯代码生成，无精灵图）
- 实时展示 Agent 思考、投票、文件传递动画
- 支持鼠标滚轮缩放 (0.5x–3x) 和拖拽平移
- 高 DPI 屏幕自适应

### 💬 多轮对话 | Multi-Turn Conversations

- 完整的会话管理（创建、切换、删除）
- 流式实时回复显示
- Markdown 格式化渲染（标题、加粗、代码块、列表、表格）
- 消息级别处理详情可展开查看（流程轨迹、投票记录）

### 🌐 中英双语界面 | Bilingual UI (Chinese / English)

- 一键切换中文 / English
- 所有 UI 文本、Agent 名称、状态标签完整翻译

### 🔒 宪法约束系统 | Constitutional Constraint System

- 五大修正案：用户主权、安全底线、质量保障、透明度、效率
- 司法分支可对任务结果进行违宪审查
- 用户可通过 `/amend` 命令自定义宪法条款

---

## 🏗️ 架构 | Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + PixiJS)               │
│  ┌──────────┐  ┌───────────────────────┐  ┌──────────────┐ │
│  │ Sidebar   │  │ Pixel World + Chat    │  │ Agent Monitor│ │
│  │ 会话列表   │  │ 像素世界 + 聊天面板    │  │ 状态监控面板  │ │
│  └──────────┘  └───────────────────────┘  └──────────────┘ │
│                         │ WebSocket                         │
├─────────────────────────┼───────────────────────────────────┤
│                     Backend (FastAPI)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │ REST API    │  │ Event Bus   │  │ Orchestrator     │   │
│  │ 会话/消息    │  │ 事件总线     │  │ 状态机编排器      │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
│                                           │                 │
│  ┌────────────────────────────────────────┼───────────┐    │
│  │              16 AI Agents              │           │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┴─────┐    │    │
│  │  │Executive │  │Legislative│  │  Judicial    │    │    │
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

### 状态机流转 | State Machine Flow

```
intake → drafting → house_review → senate_review → president_review
    │                                                      │
    │   ┌─── vetoed ← ─── ─── ─── ─── ─── ─── ─── ─── ───┘
    │   │        │
    │   │   override_vote
    │   │        │
    │   └────────┴──→ executing → judicial_review → enacted
    │                                    │
    └──→ L1/L2 快速通道 ──→ completed    └──→ unconstitutional / tabled
```

---

## 🚀 快速开始 | Quick Start

### 环境要求 | Prerequisites

- Python 3.11+
- Node.js 18+
- OpenAI API Key (GPT-4o)

### 1. 克隆仓库 | Clone

```bash
git clone https://github.com/YOUR_USERNAME/fedagent.git
cd fedagent
```

### 2. 配置 | Configure

```bash
cp config.yaml.example config.yaml
# 编辑 config.yaml，填入你的 API Key
# Edit config.yaml with your API key
```

```yaml
provider: openai
api_key: sk-your-api-key-here
large_model: gpt-4o        # 用于总统、议长等核心 Agent
small_model: gpt-4o-mini   # 用于部长、委员会等辅助 Agent
```

### 3. 安装与启动 | Install & Run

**一键启动 | One-click Start:**

```bash
# Windows
start.bat

# Linux / macOS
./start.sh
```

**手动启动 | Manual Start:**

```bash
# 后端 Backend
pip install -r requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000

# 前端 Frontend (新终端 new terminal)
cd frontend
npm install
npm run dev
```

### 4. 访问 | Access

打开浏览器访问 / Open browser at: **http://localhost:5173**

---

## 📊 任务级别 | Task Levels

FedAgent 根据任务复杂度提供四种处理级别：

FedAgent provides four processing levels based on task complexity:

| 级别 Level | 名称 Name | 处理流程 Process | 耗时 Time | 适用场景 Use Case |
|:----------:|:---------:|:----------------|:---------:|:----------------|
| ⚡ **L1** | 快速回复 Quick Reply | 幕僚长直接回答 | ~5s | 简单问答、闲聊 |
| 🔵 **L2** | 行政审批 Executive | 总统审批 → 部长执行 | ~15s | 常规任务、代码生成 |
| 🟣 **L3** | 立法审议 Legislative | 起草 → 两院投票 → 总统签署 | ~45s | 复杂决策、方案设计 |
| 🔴 **L4** | 全面审查 Full Review | L3 + 最高法院违宪审查 | ~60s | 高风险操作、安全审计 |

你可以在输入框左侧手动选择级别，或选择 **自动 (Auto)** 让 AI 自动判断。

Select a level manually from the input bar, or choose **Auto** to let AI decide.

---

## ⚖️ 宪法系统 | Constitution

系统内置五大修正案，作为所有 Agent 行为的最高准则：

Five built-in amendments serve as the supreme guidelines for all agent behavior:

1. **用户主权 User Sovereignty** — 用户指令优先于系统流程
2. **安全底线 Security Baseline** — 不得引入已知安全漏洞
3. **质量保障 Quality Assurance** — 输出必须相关且有用
4. **透明度 Transparency** — 所有决策过程可追溯
5. **效率 Efficiency** — 简单任务不得过度流程化

详见 [`CONSTITUTION.md`](./CONSTITUTION.md)。

---

## 🛠️ 技术栈 | Tech Stack

| 层级 Layer | 技术 Technology |
|:----------:|:---------------|
| 前端 Frontend | React 18, TypeScript 5, Vite 6, TailwindCSS 3, PixiJS 8, Zustand 5 |
| 后端 Backend | Python 3.11, FastAPI, SQLAlchemy (async SQLite), WebSocket |
| AI 模型 Models | OpenAI GPT-4o (核心 Agent), GPT-4o-mini (辅助 Agent) |
| 可视化 Viz | PixiJS 程序化像素艺术 (Procedural Pixel Art) |
| 状态管理 State | Zustand (前端), 有限状态机 FSM (后端编排器) |

---

## 📁 项目结构 | Project Structure

```
fedagent/
├── backend/
│   ├── app/
│   │   ├── api/              # REST API 路由
│   │   │   ├── conversations.py  # 会话 CRUD + 消息
│   │   │   └── tasks.py         # 任务提交/控制
│   │   ├── models/           # SQLAlchemy 模型
│   │   │   ├── task.py          # 任务模型
│   │   │   └── conversation.py  # 会话/消息模型
│   │   ├── services/         # 服务层
│   │   │   └── event_bus.py     # WebSocket 事件总线
│   │   ├── workers/          # 核心工作器
│   │   │   └── orchestrator.py  # 状态机编排器
│   │   ├── database.py       # 数据库配置
│   │   └── main.py           # FastAPI 入口
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/       # React 组件
│   │   │   ├── ChatPanel.tsx    # 聊天消息面板
│   │   │   ├── ChatInput.tsx    # 输入框 + 级别选择
│   │   │   ├── PixiCanvas.tsx   # 像素世界画布
│   │   │   └── ...
│   │   ├── engine/           # PixiJS 渲染引擎
│   │   ├── stores/           # Zustand 状态管理
│   │   ├── hooks/            # 自定义 Hooks
│   │   └── i18n.ts           # 国际化翻译
│   └── ...
├── agents/                   # Agent 提示词定义
├── CONSTITUTION.md           # 系统宪法
├── config.yaml               # 模型配置 (需自行创建)
└── docker-compose.yml        # Docker 部署
```

---

## 🐳 Docker 部署 | Docker Deployment

```bash
docker-compose up -d
```

访问 / Visit: **http://localhost:8000**

---

## 📄 License

MIT

---

<p align="center">
  <strong>🏛️ FedAgent</strong> — <em>AI with Checks and Balances</em>
</p>
