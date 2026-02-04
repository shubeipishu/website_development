"""
FastAPI 后端应用主入口

提供 API 服务，包含健康检查、反馈提交、访问统计等端点。
运行方式: uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
"""

import os
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr

# ============================================================
# 配置
# ============================================================

# 数据目录（容器内挂载的持久化目录）
DATA_DIR = Path("/app/data")
DATA_DIR.mkdir(exist_ok=True)

# SQLite 数据库路径
DB_PATH = DATA_DIR / "website.db"

# 反馈 JSON 文件路径（备用方案）
FEEDBACK_FILE = DATA_DIR / "feedback.json"

# 管理员 API Key（从环境变量读取）
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")

# ============================================================
# 数据库初始化
# ============================================================

def init_db():
    """初始化 SQLite 数据库表"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 反馈表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT
        )
    """)
    
    # 访问统计表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            page TEXT NOT NULL,
            referrer TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_address TEXT
        )
    """)

    # 索引：提升按天+页面+IP 的去重查询性能
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_visits_page_ip_date
        ON visits (page, ip_address, created_at)
    """)
    
    conn.commit()
    conn.close()

# 启动时初始化数据库
init_db()

# ============================================================
# FastAPI 应用
# ============================================================

app = FastAPI(
    title="Website Backend API",
    description="个人网站后端 API 服务",
    version="2.0.0"
)

# 启用 CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# 数据模型
# ============================================================

class FeedbackCreate(BaseModel):
    """反馈提交模型"""
    email: Optional[str] = None
    message: str
    timestamp: Optional[str] = None

class VisitRecord(BaseModel):
    """访问记录模型"""
    page: str
    referrer: Optional[str] = None
    timestamp: Optional[str] = None

# ============================================================
# 健康检查
# ============================================================

@app.get("/api/health")
async def health_check():
    """
    健康检查端点
    
    返回服务器状态，用于负载均衡器或监控系统检测服务可用性。
    """
    return {"status": "ok"}


@app.get("/api/info")
async def app_info():
    """
    应用信息端点
    
    返回应用的版本信息。
    """
    return {
        "name": "Website Backend",
        "version": "2.0.0",
        "description": "个人网站后端 API 服务",
        "features": ["feedback", "stats"]
    }

# ============================================================
# 反馈功能
# ============================================================

@app.post("/api/feedback")
async def submit_feedback(feedback: FeedbackCreate):
    """
    提交用户反馈
    
    将反馈存储到数据库。
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute(
            "INSERT INTO feedback (email, message, created_at) VALUES (?, ?, ?)",
            (feedback.email, feedback.message, datetime.now().isoformat())
        )
        
        conn.commit()
        feedback_id = cursor.lastrowid
        conn.close()
        
        return {
            "success": True,
            "message": "反馈已提交",
            "id": feedback_id
        }
    except Exception as e:
        # 备用方案：保存到 JSON 文件
        try:
            feedbacks = []
            if FEEDBACK_FILE.exists():
                feedbacks = json.loads(FEEDBACK_FILE.read_text(encoding="utf-8"))
            
            feedbacks.append({
                "email": feedback.email,
                "message": feedback.message,
                "timestamp": feedback.timestamp or datetime.now().isoformat()
            })
            
            FEEDBACK_FILE.write_text(
                json.dumps(feedbacks, ensure_ascii=False, indent=2),
                encoding="utf-8"
            )
            
            return {"success": True, "message": "反馈已提交（文件存储）"}
        except Exception as file_error:
            raise HTTPException(status_code=500, detail=f"反馈提交失败: {str(e)}")


@app.get("/api/feedback")
async def get_feedbacks(limit: int = 50, x_api_key: str = Header(None)):
    """
    获取反馈列表（管理用）
    
    需要提供有效的 API Key 才能访问。
    在请求头中添加: X-Api-Key: <your-key>
    """
    # 验证 API Key
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="管理功能未配置")
    if x_api_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="未授权访问")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, email, message, created_at FROM feedback ORDER BY created_at DESC LIMIT ?",
            (limit,)
        )
        
        feedbacks = [
            {"id": row[0], "email": row[1], "message": row[2], "created_at": row[3]}
            for row in cursor.fetchall()
        ]
        
        conn.close()
        return {"feedbacks": feedbacks, "count": len(feedbacks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取反馈失败: {str(e)}")

# ============================================================
# 访问统计
# ============================================================

@app.post("/api/stats/visit")
async def record_visit(visit: VisitRecord, request: Request, x_forwarded_for: str = Header(None)):
    """
    记录页面访问
    
    存储访问记录到数据库。
    """
    try:
        # 取客户端 IP（优先使用代理转发头）
        ip_address = None
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(",")[0].strip()
        if not ip_address and request.client:
            ip_address = request.client.host

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # 防刷：同一 IP + 页面在同一天只计一次
        today = datetime.now().strftime("%Y-%m-%d")
        cursor.execute(
            "SELECT 1 FROM visits WHERE page = ? AND ip_address = ? AND created_at LIKE ? LIMIT 1",
            (visit.page, ip_address, f"{today}%")
        )
        exists = cursor.fetchone() is not None

        if not exists:
            cursor.execute(
                "INSERT INTO visits (page, referrer, created_at, ip_address) VALUES (?, ?, ?, ?)",
                (visit.page, visit.referrer, datetime.now().isoformat(), ip_address)
            )
            conn.commit()

        conn.close()
        return {"success": True, "counted": not exists}
    except Exception as e:
        # 静默失败，不影响用户体验
        return {"success": False}


@app.get("/api/stats")
async def get_stats():
    """
    获取访问统计
    
    返回网站访问统计数据。
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 总访问量
        cursor.execute("SELECT COUNT(*) FROM visits")
        total_visits = cursor.fetchone()[0]
        
        # 今日访问量
        today = datetime.now().strftime("%Y-%m-%d")
        cursor.execute(
            "SELECT COUNT(*) FROM visits WHERE created_at LIKE ?",
            (f"{today}%",)
        )
        today_visits = cursor.fetchone()[0]
        
        # 页面访问排行
        cursor.execute("""
            SELECT page, COUNT(*) as count 
            FROM visits 
            GROUP BY page 
            ORDER BY count DESC 
            LIMIT 10
        """)
        top_pages = [{"page": row[0], "count": row[1]} for row in cursor.fetchall()]
        
        conn.close()
        
        return {
            "total_visits": total_visits,
            "today_visits": today_visits,
            "top_pages": top_pages
        }
    except Exception as e:
        return {
            "total_visits": 0,
            "today_visits": 0,
            "top_pages": [],
            "error": str(e)
        }


@app.get("/api/stats/count")
async def get_visit_count():
    """
    获取简单的访问计数
    
    用于页脚显示。
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM visits")
        count = cursor.fetchone()[0]
        conn.close()
        return {"count": count}
    except Exception:
        return {"count": 0}
