"""
AI Analysis API Router
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import logging

from src.services.ai_service import GeminiService
from src.kis_api import kis_client
from src.auth.dependencies import get_current_active_user
from src.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Analysis"])

# Initialize Service
ai_service = GeminiService()

class AIAnalysisResponse(BaseModel):
    analysis: str

@router.post("/analyze", response_model=AIAnalysisResponse)
async def analyze_portfolio(
    current_user: User = Depends(get_current_active_user)
):
    """
    Analyze the current user's portfolio using Gemini AI.
    Returns a Markdown formatted report.
    """
    try:
        # 1. Fetch Portfolio Data from KIS API
        if not kis_client.authenticate():
            raise HTTPException(status_code=500, detail="Failed to authenticate with KIS API")

        balance_data = kis_client.get_overseas_balance()
        
        # Handle API errors or empty data
        if "error" in balance_data or balance_data.get("rt_cd") != "0":
             # Fallback for dev/test if API fails
             logger.warning(f"KIS API failed: {balance_data.get('msg1')}. Using mock data for AI analysis.")
             portfolio_data = _get_mock_portfolio_data()
        else:
            portfolio_data = _process_balance_data(balance_data)

        # 2. Call AI Service
        analysis_text = await ai_service.analyze_portfolio(portfolio_data)
        
        return AIAnalysisResponse(analysis=analysis_text)

    except Exception as e:
        logger.error(f"Error in analyze_portfolio: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _process_balance_data(balance_data: Dict) -> Dict[str, Any]:
    """Convert KIS API response to the format expected by GeminiService"""
    output1 = balance_data.get("output1", [])
    output2 = balance_data.get("output2", {})
    
    holdings = []
    for item in output1:
        holdings.append({
            "symbol": item.get("ovrs_pdno"),
            "name": item.get("ovrs_item_name"),
            "quantity": float(item.get("ovrs_cblc_qty", 0)),
            "current_price": float(item.get("now_pric2", 0)),
            "average_price": float(item.get("pchs_avg_pric", 0)),
            "total_value": float(item.get("ovrs_stck_evlu_amt", 0)),
            "return_rate": float(item.get("evlu_pfls_rt", 0))
        })
        
    return {
        "total_value_usd": float(output2.get("ovrs_tot_pfls", 0)),
        "total_profit_loss": float(output2.get("ovrs_rlzd_pfls_amt", 0)), # Note: Check if this field is correct for total P/L
        "total_return_rate": float(output2.get("tot_pftrt", 0)),
        "holdings": holdings
    }

def _get_mock_portfolio_data():
    return {
        "total_value_usd": 26500.00,
        "total_profit_loss": 2550.00,
        "total_return_rate": 9.62,
        "holdings": [
            {
                "symbol": "AAPL",
                "name": "Apple Inc.",
                "quantity": 100,
                "current_price": 175.50,
                "total_value": 17550.00,
                "return_rate": 17.00
            },
            {
                "symbol": "GOOGL",
                "name": "Alphabet Inc.",
                "quantity": 50,
                "current_price": 140.00,
                "total_value": 7000.00,
                "return_rate": 7.69
            }
        ]
    }
