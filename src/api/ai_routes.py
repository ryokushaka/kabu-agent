"""
AI 피드백 API 라우터
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging

from src.ai.feedback import generate_portfolio_feedback
from src.kis_api import kis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Feedback"])


class HoldingItem(BaseModel):
    """개별 보유 종목 모델"""
    ticker: str
    weight: float


class PortfolioData(BaseModel):
    """포트폴리오 데이터 모델"""
    total_assets_usd: float
    total_return_percent: float
    daily_return_percent: float
    sector_distribution: Dict[str, float]
    top_holdings: List[HoldingItem]


class AIFeedbackResponse(BaseModel):
    """AI 피드백 응답 모델"""
    success: bool
    ai_analysis: Optional[Dict] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None
    generated_at: Optional[str] = None
    error: Optional[str] = None


@router.get("/feedback", response_model=AIFeedbackResponse)
async def get_ai_feedback(force_refresh: bool = False):
    """
    포트폴리오 AI 피드백 생성
    
    Query Parameters:
        force_refresh: 캐시 무시하고 새로 생성 (기본: False)
    
    Returns:
        AI 분석 및 투자 조언
    """
    try:
        logger.info("Fetching portfolio data from KIS API")
        
        # KIS API에서 포트폴리오 데이터 조회
        balance_data = kis_client.get_overseas_balance()
        
        if balance_data.get("rt_cd") != "0":
            raise HTTPException(
                status_code=400,
                detail=f"KIS API 오류: {balance_data.get('msg1', '알 수 없는 오류')}"
            )
        
        # 포트폴리오 데이터 가공
        portfolio_data = _process_balance_data(balance_data)
        
        logger.info("Generating AI feedback")
        
        # AI 피드백 생성
        result = generate_portfolio_feedback(portfolio_data)
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"AI 피드백 생성 실패: {result.get('error')}"
            )
        
        return AIFeedbackResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in get_ai_feedback: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback", response_model=AIFeedbackResponse)
async def generate_ai_feedback_with_data(portfolio_data: PortfolioData):
    """
    포트폴리오 데이터를 받아서 AI 피드백 생성 (테스트용)
    
    Request Body:
        portfolio_data: 포트폴리오 정보
    
    Returns:
        AI 분석 및 투자 조언
    """
    try:
        logger.info("Generating AI feedback with provided data")
        
        # AI 피드백 생성
        result = generate_portfolio_feedback(portfolio_data.dict())
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"AI 피드백 생성 실패: {result.get('error')}"
            )
        
        return AIFeedbackResponse(**result)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_ai_feedback_with_data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _process_balance_data(balance_data: Dict) -> Dict:
    """
    KIS API 잔고 데이터를 AI 피드백용 포트폴리오 데이터로 변환
    
    Args:
        balance_data: KIS API inquire_balance 응답
    
    Returns:
        포트폴리오 데이터 딕셔너리
    """
    output1 = balance_data.get("output1", [])
    output2 = balance_data.get("output2", {})
    
    # 총 자산
    total_assets_usd = float(output2.get("frcr_evlu_amt_smtl", 0))
    
    # 총 수익률 계산
    total_buy_amt = float(output2.get("frcr_buy_amt_smtl1", 1))
    total_profit = float(output2.get("ovrs_rlzd_pfls_amt", 0))
    total_return_percent = (total_profit / total_buy_amt * 100) if total_buy_amt > 0 else 0
    
    # 일일 수익률 (간단히 평균으로 계산)
    daily_returns = []
    for holding in output1:
        try:
            evlu_pfls_rt = float(holding.get("evlu_pfls_rt", 0))
            daily_returns.append(evlu_pfls_rt)
        except:
            continue
    
    daily_return_percent = sum(daily_returns) / len(daily_returns) if daily_returns else 0
    
    # 섹터 분포 (임시 - 실제로는 search_info API 호출 필요)
    sector_distribution = {
        "Technology": 40.0,
        "Finance": 30.0,
        "Healthcare": 20.0,
        "Others": 10.0
    }
    
    # 상위 5개 종목
    holdings_sorted = sorted(
        output1,
        key=lambda x: float(x.get("ovrs_stck_evlu_amt", 0)),
        reverse=True
    )[:5]
    
    top_holdings = []
    for holding in holdings_sorted:
        ticker = holding.get("ovrs_pdno", "")
        evlu_amt = float(holding.get("ovrs_stck_evlu_amt", 0))
        weight = (evlu_amt / total_assets_usd * 100) if total_assets_usd > 0 else 0
        
        top_holdings.append({
            "ticker": ticker,
            "weight": weight
        })
    
    return {
        "total_assets_usd": total_assets_usd,
        "total_return_percent": total_return_percent,
        "daily_return_percent": daily_return_percent,
        "sector_distribution": sector_distribution,
        "top_holdings": top_holdings
    }
