"""
FastAPI 메인 애플리케이션
"""
from dotenv import load_dotenv
load_dotenv()  # .env 파일 로드

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from src.api.portfolio_routes import router as portfolio_router
from src.api.analysis_routes import router as analysis_router
from src.api.exchange_routes import router as exchange_router
from src.api.auth_routes import router as auth_router
from src.api.export_routes import router as export_router
from src.database.connection import init_database, db_manager
from src.cache.redis_client import redis_cache
from src.api.ai_routes import router as ai_router

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="Kabu Agent API",
    description="해외주식 포트폴리오 관리 시스템 API",
    version="1.0.0"
)

# CORS 설정 (프론트엔드 연동을 위해)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 환경에서는 모두 허용, 프로덕션에서는 특정 도메인만
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(export_router)
app.include_router(analysis_router)
app.include_router(exchange_router)
app.include_router(ai_router)

# 헬스 체크 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "Kabu Agent API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """종합 헬스 체크"""
    health_status = {
        "status": "healthy",
        "database": db_manager.health_check(),
        "redis": redis_cache.health_check()
    }
    
    # 전체 상태 확인
    if not all([health_status["database"], health_status["redis"]]):
        health_status["status"] = "degraded"
    
    return health_status

# 애플리케이션 시작/종료 이벤트
@app.on_event("startup")
async def startup_event():
    """애플리케이션 시작 시 초기화"""
    try:
        # 데이터베이스 초기화
        init_database()
        logger.info("데이터베이스 초기화 완료")
        
        # Redis 연결 확인
        if redis_cache.health_check():
            logger.info("Redis 연결 확인 완료")
        else:
            logger.warning("Redis 연결 실패 - 캐시 없이 동작")
            
    except Exception as e:
        logger.error(f"애플리케이션 시작 중 오류: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """애플리케이션 종료 시 정리"""
    try:
        db_manager.close()
        redis_cache.close()
        logger.info("애플리케이션 정상 종료")
    except Exception as e:
        logger.error(f"애플리케이션 종료 중 오류: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)