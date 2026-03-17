"""
FedAgent 后端入口
三权分立多 Agent 协作框架
"""

import asyncio
import logging
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .config import load_config
from .database import init_db
from .agent_runner import AgentRunner
from .constitution import Constitution
from .workers.orchestrator import Orchestrator
from .api import tasks, ws, conversations

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(message)s")
logger = logging.getLogger("fedagent")

# 全局实例
config = None
orchestrator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期"""
    global config, orchestrator

    logger.info("=" * 50)
    logger.info("  FedAgent — 三权分立多 Agent 协作框架")
    logger.info("  Three Branches. One Goal. Better AI.")
    logger.info("=" * 50)

    # 加载配置
    config = load_config("config.yaml")
    logger.info(f"语言: {config.language}")
    logger.info(f"大模型: {config.large_model.provider}/{config.large_model.model_id}")
    logger.info(f"小模型: {config.small_model.provider}/{config.small_model.model_id}")

    # 初始化数据库
    await init_db(config.database_url)
    logger.info("数据库初始化完成")

    # 初始化组件
    agent_runner = AgentRunner(config, agents_dir=config.agents_dir)
    constitution = Constitution(config.constitution_path)
    orchestrator = Orchestrator(config, agent_runner, constitution)
    logger.info(f"Agent 数量: 16 | 宪法条款: 已加载")
    logger.info(f"服务地址: http://localhost:{config.port}")

    # 存到 app.state
    app.state.config = config
    app.state.orchestrator = orchestrator

    yield

    logger.info("FedAgent 关闭")


app = FastAPI(
    title="FedAgent",
    description="三权分立多 Agent 协作框架",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
app.include_router(tasks.router)
app.include_router(conversations.router)
app.include_router(ws.router)


# ── API 端点 ──

from pydantic import BaseModel
from typing import Optional


class SubmitTaskRequest(BaseModel):
    message: str
    level: Optional[str] = ""


@app.post("/api/submit")
async def submit_task(req: SubmitTaskRequest):
    """提交新任务"""
    orch = app.state.orchestrator
    task_id = await orch.handle_new_task("", req.message, req.level)
    return {"task_id": task_id, "message": "任务已提交"}


@app.post("/api/tasks/{task_id}/fast")
async def task_fast(task_id: str):
    """用户 /fast 命令"""
    await app.state.orchestrator.user_fast(task_id)
    return {"ok": True}


@app.post("/api/tasks/{task_id}/skip")
async def task_skip(task_id: str):
    """用户 /skip 命令"""
    await app.state.orchestrator.user_skip(task_id)
    return {"ok": True}


@app.post("/api/tasks/{task_id}/stop")
async def task_stop(task_id: str):
    """用户 /stop 命令"""
    await app.state.orchestrator.user_stop(task_id)
    return {"ok": True}


@app.post("/api/amend")
async def add_amendment(text: str):
    """添加宪法修正案"""
    constitution = Constitution()
    constitution.add_amendment(text)
    return {"ok": True, "message": f"修正案已添加: {text}"}


@app.get("/api/config")
async def get_config():
    """获取当前配置 (脱敏)"""
    cfg = app.state.config
    return {
        "language": cfg.language,
        "large_model": {
            "provider": cfg.large_model.provider,
            "model_id": cfg.large_model.model_id,
        },
        "small_model": {
            "provider": cfg.small_model.provider,
            "model_id": cfg.small_model.model_id,
        },
        "agents": {
            aid: {"tier": acfg.tier, "provider": acfg.provider, "model_id": acfg.model_id}
            for aid, acfg in cfg.agents.items()
        },
    }


@app.get("/api/agents")
async def list_agents():
    """获取所有 Agent 信息"""
    cfg = app.state.config
    agents = []
    all_agents = {
        "executive": [
            ("president", "总统", "large"),
            ("chief_of_staff", "幕僚长", "small"),
            ("sec_strategy", "战略部长", "small"),
            ("sec_research", "研究部长", "small"),
            ("sec_operations", "执行部长", "small"),
            ("sec_quality", "质量部长", "small"),
            ("attorney_general", "总检察长", "small"),
        ],
        "legislative": [
            ("speaker_house", "众议院议长", "large"),
            ("senate_leader", "参议院领袖", "large"),
            ("house_committee", "众院委员会", "small"),
            ("senate_committee", "参院委员会", "small"),
            ("cbo", "预算办公室", "small"),
        ],
        "judicial": [
            ("chief_justice", "首席大法官", "large"),
            ("justice_progressive", "进步派大法官", "small"),
            ("justice_originalist", "保守派大法官", "small"),
        ],
        "independent": [
            ("press_secretary", "新闻秘书", "small"),
        ],
    }
    for branch, members in all_agents.items():
        for agent_id, name, default_tier in members:
            model_cfg = cfg.get_model_for_agent(agent_id)
            agents.append({
                "id": agent_id,
                "name": name,
                "branch": branch,
                "tier": default_tier,
                "provider": model_cfg.provider,
                "model_id": model_cfg.model_id,
            })
    return agents


# 静态文件 (前端)
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(str(frontend_dist / "index.html"))

    @app.get("/{path:path}")
    async def serve_frontend_fallback(path: str):
        file = frontend_dist / path
        if file.exists() and file.is_file():
            return FileResponse(str(file))
        return FileResponse(str(frontend_dist / "index.html"))
