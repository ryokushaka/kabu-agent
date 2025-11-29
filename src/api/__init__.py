"""
API 라우터 초기화
"""
from src.api.auth_routes import router as auth_router
from src.api.portfolio_routes import router as portfolio_router
from src.api.analysis_routes import router as analysis_router
from src.api.ai_routes import router as ai_router
from src.api.exchange_routes import router as exchange_router
from src.api.export_routes import router as export_router

__all__ = [
    "auth_router",
    "portfolio_router", 
    "analysis_router",
    "ai_router",
    "exchange_router",
    "export_router"
]
