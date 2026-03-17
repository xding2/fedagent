FROM python:3.11-slim

WORKDIR /app

# 安装 Node.js（构建前端用）
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 构建前端
COPY frontend/package*.json frontend/
RUN cd frontend && npm install

COPY frontend/ frontend/
RUN cd frontend && npm run build

# 复制后端
COPY backend/ backend/
COPY cli/ cli/
COPY agents/ agents/
COPY CONSTITUTION.md .
COPY setup.py .

RUN pip install -e .

# 数据目录
RUN mkdir -p data

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
