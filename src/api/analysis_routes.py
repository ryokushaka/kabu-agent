from fastapi import APIRouter, HTTPException
from src.api.portfolio_routes import get_portfolio_balance
from src.kis_api import kis_client
from src.database.models import User
from src.auth.dependencies import get_current_active_user
from fastapi import Depends
from src.analysis.metrics import (
    calculate_daily_returns, calculate_volatility, 
    calculate_beta, calculate_sharpe_ratio, calculate_max_drawdown
)
import pandas as pd
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

from src.services.analysis_service import perform_portfolio_analysis

@router.get("/portfolio")
async def get_portfolio_analysis(
    current_user: User = Depends(get_current_active_user)
):
    """포트폴리오 리스크 분석 및 벤치마크 비교"""
    try:
        balance = await get_portfolio_balance(current_user=current_user)
        result = await perform_portfolio_analysis(balance)
        
        if not result:
             return {"message": "Analysis failed or no data"}
             
        return result

    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sector")
async def get_sector_analysis(
    current_user: User = Depends(get_current_active_user)
):
    """섹터별 비중 분석"""
    try:
        balance = await get_portfolio_balance(current_user=current_user)
        if not balance.positions:
            return {"sectors": []}
            
        # 섹터 정보 조회 및 집계
        sector_map = {}
        total_value = balance.stock_value
        
        for pos in balance.positions:
            # 섹터 정보가 없으면 조회 (이미 balance에 있을 수도 있음)
            # 여기서는 간단히 KIS API 호출 또는 모델에 있는 정보 사용
            # Holding 모델에 sector가 있지만, balance.positions는 Position 모델일 수 있음
            # models.py의 Holding과 api.ts의 Position 매핑 확인 필요
            # 여기서는 kis_client.get_overseas_stock_details 사용
            details = kis_client.get_overseas_stock_details(pos.ticker)
            sector = details.get("sector", "Unknown")
            
            if sector not in sector_map:
                sector_map[sector] = {"value": 0.0, "count": 0}
            
            sector_map[sector]["value"] += pos.market_value
            sector_map[sector]["count"] += 1
            
        sectors = []
        for name, data in sector_map.items():
            sectors.append({
                "sector": name,
                "value": data["value"],
                "weight": (data["value"] / total_value * 100) if total_value > 0 else 0,
                "count": data["count"]
            })
            
        return {"sectors": sectors}
        
    except Exception as e:
        logger.error(f"Sector analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/returns")
async def get_returns_analysis(
    current_user: User = Depends(get_current_active_user)
):
    """수익률 분석 (최고/최악 종목 등)"""
    try:
        balance = await get_portfolio_balance(current_user=current_user)
        if not balance.positions:
            return {}
            
        # 수익률 기준 정렬
        sorted_positions = sorted(balance.positions, key=lambda x: x.profit_loss_percent, reverse=True)
        
        best = sorted_positions[0]
        worst = sorted_positions[-1]
        
        return {
            "daily_return": 0.0, # 일일 수익률은 별도 계산 필요 (전일 대비)
            "total_return": balance.total_return_percent,
            "total_profit_loss": balance.total_profit_loss,
            "best_performer": {
                "ticker": best.ticker,
                "name": best.name,
                "return": best.profit_loss_percent,
                "profit_loss": best.profit_loss
            },
            "worst_performer": {
                "ticker": worst.ticker,
                "name": worst.name,
                "return": worst.profit_loss_percent,
                "profit_loss": worst.profit_loss
            }
        }
        
    except Exception as e:
        logger.error(f"Returns analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
