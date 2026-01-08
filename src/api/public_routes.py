"""
Public Routes for Non-authenticated Users
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging
from sqlalchemy import select

from src.kis_api import kis_client
from src.services.ai_service import GeminiService
from src.database.connection import db_manager
from src.database.models import MarketNews
from src.cache.redis_client import redis_cache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/public", tags=["Public"])
ai_service = GeminiService()

@router.get("/market/indices")
async def get_market_indices():
    """
    Get major overseas market indices (NASDAQ, S&P 500, DJIA, PHL)
    """
    try:
        indices = {}
        # Note: kis_api.py get_overseas_index_price uses EXCD.
        # Common KIS codes: NAS (Nasdaq), NYS (NYSE), AMS (Amex) - these are exchanges.
        # For indices, we might need specific symbols or use the index-price endpoint if available.
        # Based on kis_api.py `get_overseas_index_price(self, index_code="NAS")`, it seems to accept exchange code as index?
        # Let's try fetching for NAS, NYS first as proxies or real indices if supported.
        # Re-reading kis_api.py: get_overseas_index_price takes index_code (NAS, DOW, SPX).
        
        # We will try to fetch a few.
        for code, name in [("NAS", "NASDAQ"), ("SPX", "S&P 500"), ("DOW", "Dow Jones")]:
             try:
                 data = kis_client.get_overseas_index_price(code)
                 if data and data.get("output1"):
                     # output1 usually contains price info
                     output1 = data["output1"]
                     # output1 keys might differ. Assuming standard KIS response or we mock if it fails/returns empty.
                     # Let's inspect the expected output in kis_api.py or assume standard.
                     # "ovrs_nmix_prpr": current price, "ct_nmix_prpr": change, "ovrs_nmix_fluc_rt": change rate
                     indices[name] = {
                         "price": output1.get("ovrs_nmix_prpr", "0.00"),
                         "change": output1.get("ct_nmix_prpr", "0.00"),
                         "change_percent": output1.get("ovrs_nmix_fluc_rt", "0.00")
                     }
             except Exception as e:
                 logger.warning(f"Failed to fetch index {code}: {e}")
                 # Mock if failed, so frontend doesn't break
                 # indices[name] = {"price": "0.00", "change": "0.00", "change_percent": "0.00"}

        return indices
    except Exception as e:
        logger.error(f"Error serving market indices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market/news")
async def get_market_news(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    category: Optional[str] = None
):
    """
    시장 뉴스 조회 (DB 기반)
    """
    try:
        # Redis 캐시 확인
        cache_key = f"public:market_news:{limit}:{offset}:{category}"
        cached = redis_cache.get(cache_key)
        if cached:
            return cached

        with db_manager.get_session() as session:
            query = select(MarketNews).order_by(MarketNews.published_at.desc())

            if category:
                query = query.where(MarketNews.category == category)

            query = query.limit(limit).offset(offset)

            news_items = session.execute(query).scalars().all()

            # AI 요약 생성 (최신 5개 뉴스)
            top_news = news_items[:5]
            if top_news:
                summary_text = await ai_service.summarize_news([
                    {"title": n.title, "snippet": n.summary or "", "link": n.content_url}
                    for n in top_news
                ])
            else:
                summary_text = "뉴스 데이터가 아직 수집되지 않았습니다."

            result = {
                "summary": summary_text,
                "news": [
                    {
                        "id": str(n.id),
                        "title": n.title,
                        "summary": n.summary,
                        "url": n.content_url,
                        "source": n.source,
                        "published_at": n.published_at.isoformat(),
                        "is_featured": n.is_featured,
                        "category": n.category
                    }
                    for n in news_items
                ],
                "total": len(news_items)
            }

            # 캐시 저장 (10분)
            redis_cache.set(cache_key, result, ex=600)

            return result

    except Exception as e:
        logger.error(f"Error serving market news: {e}")
        raise HTTPException(status_code=500, detail=str(e))
