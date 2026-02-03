# ============================================================
# FastAPI Backend Dockerfile
# 基于 Python 3.11 slim 镜像构建轻量级后端服务
# ============================================================

FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置 Python 环境变量
# PYTHONDONTWRITEBYTECODE: 不生成 .pyc 字节码文件
# PYTHONUNBUFFERED: 禁用输出缓冲，确保日志实时输出
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# 复制依赖文件
COPY requirements.txt .

# 安装依赖 (直接安装到系统环境，不创建虚拟环境以保持镜像精简)
# --no-cache-dir: 不缓存下载的包，减小镜像体积
RUN pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY src/ ./src/

# 暴露服务端口
EXPOSE 8000

# 启动命令
# --host 0.0.0.0: 监听所有网络接口
# --port 8000: 监听 8000 端口
# --reload: 开发模式下启用热重载 (生产环境应移除)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
