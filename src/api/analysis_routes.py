"""
분석 API 라우터
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List
import logging
from collections import defaultdict

from src.api.portfolio_routes import get_portfolio_balance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])


class SectorAllocation(BaseModel):
    """섹터 배분 모델"""
    sector: str
    value: float
    weight: float
    count: int


class ReturnAnalysis(BaseModel):
    """수익률 분석 모델"""
    daily_return: float
    total_return: float
    total_profit_loss: float
    best_performer: Dict
    worst_performer: Dict


@router.get("/sector")
async def get_sector_analysis():
    """
    섹터별 분석
    
    Returns:
        섹터별 자산 배분 및 비중
    """
    try:
        logger.info("Analyzing portfolio by sector")
        
        # 포트폴리오 데이터 조회
        balance = await get_portfolio_balance()
        
        # 섹터별 집계 (임시로 티커 기반 분류)
        sector_data = defaultdict(lambda: {"value": 0.0, "count": 0})
        
        for position in balance.positions:
            # TODO: 실제 섹터 정보는 search_info API로 조회 필요
            # 임시로 티커 첫 글자로 그룹화
            sector = position.sector or _guess_sector(position.ticker)
            sector_data[sector]["value"] += position.market_value
            sector_data[sector]["count"] += 1
        
        # SectorAllocation 모델로 변환
        sectors = []
        for sector, data in sector_data.items():
            sectors.append(SectorAllocation(
                sector=sector,
                value=data["value"],
                weight=(data["value"] / balance.total_assets * 100) if balance.total_assets > 0 else 0,
                count=data["count"]
            ))
        
        # 비중 순으로 정렬
        sectors.sort(key=lambda x: x.weight, reverse=True)
        
        logger.info(f"Sector analysis completed: {len(sectors)} sectors")
        return {"sectors": sectors}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing sectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/returns", response_model=ReturnAnalysis)
async def get_return_analysis():
    """
    수익률 분석
    
    Returns:
        전체 수익률, 일일 수익률, 최고/최저 종목
    """
    try:
        logger.info("Analyzing portfolio returns")
        
        # 포트폴리오 데이터 조회
        balance = await get_portfolio_balance()
        
        if not balance.positions:
            raise HTTPException(status_code=404, detail="보유 종목이 없습니다")
        
        # 일일 수익률 계산 (임시로 전체 수익률 사용)
        daily_return = balance.total_return_percent  # TODO: 실제 일일 수익률 계산 필요
        
        # 최고/최저 수익 종목 찾기
        best = max(balance.positions, key=lambda x: x.profit_loss_percent)
        worst = min(balance.positions, key=lambda x: x.profit_loss_percent)
        
        result = ReturnAnalysis(
            daily_return=daily_return,
            total_return=balance.total_return_percent,
            total_profit_loss=balance.total_profit_loss,
            best_performer={
                "ticker": best.ticker,
                "name": best.name,
                "return": best.profit_loss_percent,
                "profit_loss": best.profit_loss
            },
            worst_performer={
                "ticker": worst.ticker,
                "name": worst.name,
                "return": worst.profit_loss_percent,
                "profit_loss": worst.profit_loss
            }
        )
        
        logger.info(f"Return analysis completed: total={result.total_return:.2f}%")
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing returns: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _guess_sector(ticker: str) -> str:
    """
    티커 기반 섹터 추정 (포괄적 매핑)
    """
    ticker_upper = ticker.upper()
    
    # 포괄적인 섹터 매핑
    sector_mapping = {
        # Technology
        "Technology": [
            "AAPL", "MSFT", "GOOGL", "GOOG", "META", "NVDA", "TSLA", "NFLX", "AMD", 
            "CRM", "ORCL", "ADBE", "NOW", "INTC", "QCOM", "AVGO", "TXN", "INTU",
            "CSCO", "IBM", "PYPL", "SNOW", "CRWD", "ZM", "UBER", "LYFT", "SQ",
            "SHOP", "ROKU", "TWLO", "OKTA", "ZS", "NET", "DDOG", "PLTR"
        ],
        
        # Finance
        "Finance": [
            "JPM", "BAC", "WFC", "C", "GS", "MS", "BK", "USB", "PNC", "TFC",
            "COF", "AXP", "BLK", "SCHW", "CB", "ICE", "CME", "SPGI", "MCO",
            "V", "MA", "FIS", "FISV", "ADP"
        ],
        
        # Healthcare
        "Healthcare": [
            "JNJ", "PFE", "UNH", "ABBV", "TMO", "ABT", "LLY", "MDT", "BMY", "MRK",
            "AMGN", "GILD", "CVS", "DHR", "SYK", "BSX", "ISRG", "ZTS", "CI", "HUM",
            "ANTM", "REGN", "VRTX", "BIIB", "ILMN", "MRNA", "BNTX", "ZTS"
        ],
        
        # Consumer Discretionary
        "Consumer": [
            "AMZN", "TSLA", "HD", "MCD", "SBUX", "LOW", "TJX", "NKE", "BKNG",
            "CMG", "ORLY", "YUM", "QSR", "DIS", "NFLX", "CHTR", "CMCSA"
        ],
        
        # Energy
        "Energy": [
            "XOM", "CVX", "COP", "EOG", "SLB", "PSX", "VLO", "MPC", "OXY", "BKR",
            "HAL", "DVN", "FANG", "APA", "HES", "MRO", "NOV"
        ],
        
        # Industrial
        "Industrial": [
            "BA", "HON", "UNP", "CAT", "GE", "MMM", "LMT", "RTX", "UPS", "FDX",
            "CSX", "NSC", "UAL", "AAL", "DAL", "LUV", "JBLU"
        ],
        
        # Materials
        "Materials": [
            "LIN", "APD", "ECL", "SHW", "FCX", "NEM", "GOLD", "SCCO", "CF", "MOS",
            "IFF", "DD", "DOW", "PPG", "VMC", "MLM"
        ],
        
        # Real Estate
        "Real Estate": [
            "AMT", "PLD", "CCI", "EQIX", "WELL", "DLR", "PSA", "O", "CBRE", "AVB",
            "EQR", "VTR", "ESS", "MAA", "UDR", "CPT", "EXR"
        ],
        
        # Utilities
        "Utilities": [
            "NEE", "DUK", "SO", "AEP", "EXC", "XEL", "SRE", "D", "PEG", "EIX",
            "WEC", "AWK", "AEE", "CMS", "EVRG", "NI", "LNT", "CNP"
        ]
    }
    
    # 티커로 섹터 찾기
    for sector, tickers in sector_mapping.items():
        if ticker_upper in tickers:
            return sector
    
    # 매핑되지 않은 경우 기본값
    return "Others"
