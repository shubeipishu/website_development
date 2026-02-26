#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

DEPLOY_LANG="${DEPLOY_LANG:-zh}"

msg() {
  local zh="$1"
  local en="$2"
  if [[ "$DEPLOY_LANG" == "en" ]]; then
    echo "$en"
  else
    echo "$zh"
  fi
}

read_env_value() {
  local key="$1"
  local file="${2:-.env}"
  if [[ ! -f "$file" ]]; then
    return 1
  fi
  grep -E "^${key}=" "$file" | tail -n 1 | cut -d'=' -f2- | tr -d '\r' | tr -d '"' | tr -d "'"
}

msg "[1/7] 检查 Git 工作区状态..." "[1/7] Checking Git working tree..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  msg "错误: 当前仓库有未提交修改，请先提交/清理后再部署。" "Error: Working tree is not clean. Commit or clean changes first."
  exit 1
fi

msg "[2/7] 拉取最新代码..." "[2/7] Pulling latest code..."
git pull --ff-only origin main

msg "[3/7] 安装前端依赖..." "[3/7] Installing frontend dependencies..."
cd frontend
npm ci --include=dev

msg "[4/7] 构建前端..." "[4/7] Building frontend..."
npm run build
cd "$SCRIPT_DIR"

msg "[5/7] 检测 Docker Compose 命令..." "[5/7] Detecting Docker Compose command..."
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  msg "错误: 未找到 docker compose / docker-compose。" "Error: docker compose / docker-compose not found."
  exit 1
fi

msg "[6/7] 启动/更新容器..." "[6/7] Rebuilding and starting containers..."
$COMPOSE_CMD up -d --build

msg "[7/7] 输出容器状态与健康检查..." "[7/7] Printing container status and health check..."
$COMPOSE_CMD ps

WEB_PORT="$(read_env_value WEB_PORT .env || true)"
WEB_PORT="${WEB_PORT:-80}"
HEALTH_URL="http://127.0.0.1:${WEB_PORT}/api/health"

msg "检测到 WEB_PORT=${WEB_PORT}" "Detected WEB_PORT=${WEB_PORT}"
if command -v curl >/dev/null 2>&1; then
  msg "健康检查: ${HEALTH_URL}" "Health check: ${HEALTH_URL}"
  success=0
  for _ in $(seq 1 12); do
    if curl -fsS "$HEALTH_URL" >/dev/null 2>&1; then
      success=1
      break
    fi
    sleep 2
  done
  if [[ "$success" -eq 1 ]]; then
    msg "健康检查通过。" "Health check passed."
  else
    msg "警告: 健康检查未通过，请查看容器日志。" "Warning: Health check failed. Please check container logs."
  fi
fi

msg "部署完成。" "Deployment finished."
