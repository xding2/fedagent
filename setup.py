"""
FedAgent — 一键安装脚本
用法: pip install -e .
"""
from setuptools import setup, find_packages

setup(
    name="fedagent",
    version="0.1.0",
    description="三权分立多 Agent 协作框架",
    packages=find_packages(),
    python_requires=">=3.10",
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "sqlalchemy[asyncio]>=2.0.0",
        "aiosqlite>=0.19.0",
        "pyyaml>=6.0",
        "httpx>=0.25.0",
        "openai>=1.0.0",
    ],
    extras_require={
        "anthropic": ["anthropic>=0.30.0"],
        "all": ["anthropic>=0.30.0"],
    },
    entry_points={
        "console_scripts": [
            "fedagent=cli.fedagent:main",
        ],
    },
)
