from dotenv import load_dotenv
load_dotenv()

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import logging
import os
import time

from src.api.portfolio_routes import router as portfolio_router
from src.api.analysis_routes import router as analysis_router
from src.api.exchange_routes import router as exchange_router
from src.api.auth_routes import router as auth_router
from src.api.export_routes import router as export_router
from src.api.public_routes import router as public_router
from src.api.glossary_routes import router as glossary_router
from src.api.admin_routes import router as admin_router
from src.api.stock_routes import router as stock_router
from src.api.transaction_routes import router as transaction_router
from src.api.notification_routes import router as notification_router
from src.api.rebalance_routes import router as rebalance_router
from src.database.connection import init_database, db_manager
from src.cache.redis_client import redis_cache
from src.api.ai_routes import router as ai_router
from src.services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ResponseTimeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.perf_counter()
        response = await call_next(request)
        process_time = (time.perf_counter() - start_time) * 1000
        response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
        return response


class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        if request.url.path.startswith("/api/"):
            if request.method == "GET":
                response.headers["Cache-Control"] = "private, max-age=60"
            else:
                response.headers["Cache-Control"] = "no-store"
        
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_database()
        logger.info("Database initialized")

        if redis_cache.health_check():
            logger.info("Redis connection verified")
        else:
            logger.warning("Redis connection failed - running without cache")

        # 스케줄러 시작
        start_scheduler()
        logger.info("Scheduler started")
    except Exception as e:
        logger.error(f"Startup error: {e}")

    yield

    try:
        # 스케줄러 종료
        shutdown_scheduler()
        logger.info("Scheduler shut down")

        db_manager.close()
        redis_cache.close()
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


app = FastAPI(
    title="Kabu Agent API",
    description="해외주식 포트폴리오 관리 시스템 API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None,
)

app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(ResponseTimeMiddleware)
app.add_middleware(CacheControlMiddleware)

cors_origins = os.getenv("CORS_ORIGINS", "*")
if cors_origins == "*":
    origins = ["*"]
else:
    origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"],
)

app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(stock_router)
app.include_router(transaction_router)
app.include_router(notification_router)
app.include_router(rebalance_router)
app.include_router(export_router)
app.include_router(analysis_router)
app.include_router(exchange_router)
app.include_router(ai_router)
app.include_router(public_router)
app.include_router(glossary_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {
        "message": "Kabu Agent API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    health_status = {
        "status": "healthy",
        "database": db_manager.health_check(),
        "redis": redis_cache.health_check()
    }
    
    if not all([health_status["database"], health_status["redis"]]):
        health_status["status"] = "degraded"
    
    return health_status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.app:app",
        host="0.0.0.0",
        port=8000,
        workers=4,
        loop="uvloop",
        http="httptools",
    )
