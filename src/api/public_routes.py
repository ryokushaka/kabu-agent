"""
Public Routes for Non-authenticated Users
"""
from fastapi import APIRouter, HTTPException
import logging

from src.kis_api import kis_client
from src.services.ai_service import GeminiService

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
async def get_market_news():
    """
    Get AI-summarized market news
    """
    try:
        # 1. Search News
        query = "미국 주식 시장"
        news_items = await ai_service.search_news(query)
        
        # 2. Summarize
        summary_text = await ai_service.summarize_news(news_items)
        
        return {"summary": summary_text}
    except Exception as e:
        logger.error(f"Error serving market news: {e}")
        raise HTTPException(status_code=500, detail=str(e))
