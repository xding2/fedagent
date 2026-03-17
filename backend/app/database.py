"""数据库初始化"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from .models.task import Base
from .models.conversation import Conversation, Message  # noqa: F401 — 确保表被创建

engine = None
async_session_factory = None


async def init_db(database_url: str):
    """初始化数据库"""
    global engine, async_session_factory
    engine = create_async_engine(database_url, echo=False)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def get_session() -> AsyncSession:
    """获取数据库 session"""
    return async_session_factory()
