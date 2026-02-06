#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/7] 检查 Git 工作区状态..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "错误: 当前仓库有未提交修改，请先提交/清理后再部署。"
  exit 1
fi

echo "[2/7] 拉取最新代码..."
git pull --ff-only origin main

echo "[3/7] 安装前端依赖..."
cd frontend
npm ci --include=dev

echo "[4/7] 构建前端..."
npm run build
cd "$SCRIPT_DIR"

echo "[5/7] 检测 Docker Compose 命令..."
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  echo "错误: 未找到 docker compose / docker-compose。"
  exit 1
fi

echo "[6/7] 启动/更新容器..."
$COMPOSE_CMD up -d --build

echo "[7/7] 输出容器状态与健康检查..."
$COMPOSE_CMD ps
if command -v curl >/dev/null 2>&1; then
  echo "健康检查: http://127.0.0.1/api/health"
  curl -fsS http://127.0.0.1/api/health || echo "警告: 健康检查未通过，请查看容器日志。"
fi

echo "部署完成。"
