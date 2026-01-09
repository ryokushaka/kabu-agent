"""
종목 상세 API 라우터
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from decimal import Decimal
import logging

from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import User, Position
from src.auth.dependencies import get_current_active_user
from src.kis_api import kis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/stock", tags=["Stock"])


class StockInfo(BaseModel):
    """종목 기본 정보"""
    ticker: str
    name: str
    exchange: str
    current_price: float
    change: float
    change_percent: float
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    eps: Optional[float] = None
    dividend_yield: Optional[float] = None
    volume: Optional[int] = None
    avg_volume: Optional[int] = None
    sector: Optional[str] = None
    industry: Optional[str] = None


class ChartDataPoint(BaseModel):
    """차트 데이터 포인트"""
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class StockNews(BaseModel):
    """종목 관련 뉴스"""
    id: str
    title: str
    summary: str
    source: str
    url: str
    published_at: str
    sentiment: Optional[str] = None  # 'positive', 'negative', 'neutral'


class StockAnalysis(BaseModel):
    """AI 분석 정보"""
    recommendation: str  # 'strong_buy', 'buy', 'hold', 'sell', 'strong_sell'
    target_price: Optional[float] = None
    confidence: float
    analysis_summary: str
    key_factors: List[str]
    risks: List[str]
    updated_at: str


class UserPosition(BaseModel):
    """사용자 보유 정보"""
    quantity: int
    avg_price: float
    market_value: float
    profit_loss: float
    profit_loss_percent: float
    weight: float


@router.get("/{ticker}", response_model=StockInfo)
async def get_stock_info(
    ticker: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    종목 기본 정보 조회

    Args:
        ticker: 종목 티커 (예: AAPL, MSFT)

    Returns:
        종목 기본 정보 (현재가, 변동률, 52주 고저가 등)
    """
    try:
        logger.info(f"Fetching stock info for {ticker}")

        # KIS API로 종목 정보 조회
        stock_data = kis_client.get_overseas_stock_price(ticker.upper(), user=current_user)

        if not stock_data or stock_data.get("rt_cd") != "0":
            error_msg = stock_data.get("msg1", "종목 정보를 찾을 수 없습니다") if stock_data else "API 호출 실패"
            logger.error(f"KIS API error for {ticker}: {error_msg}")
            raise HTTPException(status_code=404, detail=f"종목 정보 조회 실패: {error_msg}")

        output = stock_data.get("output", {})

        current_price = float(output.get("last", 0))
        prev_close = float(output.get("base", 0))
        change = current_price - prev_close if prev_close > 0 else 0
        change_percent = (change / prev_close * 100) if prev_close > 0 else 0

        return StockInfo(
            ticker=ticker.upper(),
            name=output.get("rsym", ticker.upper()).replace("D", "").replace("Q", ""),
            exchange=output.get("zdiv", "NASD"),
            current_price=current_price,
            change=round(change, 2),
            change_percent=round(change_percent, 2),
            high_52w=float(output.get("h52p", 0)) or None,
            low_52w=float(output.get("l52p", 0)) or None,
            market_cap=float(output.get("tomv", 0)) * 1000000 if output.get("tomv") else None,
            pe_ratio=float(output.get("perx", 0)) or None,
            eps=float(output.get("epsx", 0)) or None,
            dividend_yield=float(output.get("divr", 0)) or None,
            volume=int(output.get("tvol", 0)) or None,
            avg_volume=int(output.get("avol", 0)) or None,
            sector=output.get("sect", None),
            industry=output.get("indu", None)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching stock info for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/chart", response_model=List[ChartDataPoint])
async def get_stock_chart(
    ticker: str,
    period: str = Query("1M", description="기간 (1W, 1M, 3M, 6M, 1Y, 5Y)"),
    current_user: User = Depends(get_current_active_user)
):
    """
    종목 차트 데이터 조회 (캔들스틱)

    Args:
        ticker: 종목 티커
        period: 조회 기간 (1W, 1M, 3M, 6M, 1Y, 5Y)

    Returns:
        OHLCV 데이터 리스트
    """
    try:
        logger.info(f"Fetching chart data for {ticker} ({period})")

        # 기간에 따른 날짜 계산
        period_days = {
            "1W": 7,
            "1M": 30,
            "3M": 90,
            "6M": 180,
            "1Y": 365,
            "5Y": 1825
        }
        days = period_days.get(period.upper(), 30)

        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)

        # KIS API로 일별 시세 조회
        chart_data = kis_client.get_overseas_daily_price(
            ticker.upper(),
            start_date.strftime("%Y%m%d"),
            end_date.strftime("%Y%m%d"),
            user=current_user
        )

        if not chart_data or chart_data.get("rt_cd") != "0":
            # API 실패 시 더미 데이터 반환 (개발용)
            logger.warning(f"Chart data not available for {ticker}, returning sample data")
            return _generate_sample_chart_data(days)

        output = chart_data.get("output2", [])

        result = []
        for item in output:
            try:
                result.append(ChartDataPoint(
                    date=f"{item.get('xymd', '')[:4]}-{item.get('xymd', '')[4:6]}-{item.get('xymd', '')[6:]}",
                    open=float(item.get("open", 0)),
                    high=float(item.get("high", 0)),
                    low=float(item.get("low", 0)),
                    close=float(item.get("clos", 0)),
                    volume=int(item.get("tvol", 0))
                ))
            except (ValueError, KeyError) as e:
                logger.warning(f"Skipping invalid chart data point: {e}")
                continue

        # 날짜순 정렬 (오래된 것부터)
        result.sort(key=lambda x: x.date)

        return result if result else _generate_sample_chart_data(days)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching chart data for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _generate_sample_chart_data(days: int) -> List[ChartDataPoint]:
    """개발용 샘플 차트 데이터 생성"""
    import random

    result = []
    base_price = 150.0
    base_date = datetime.now() - timedelta(days=days)

    for i in range(days):
        date = base_date + timedelta(days=i)
        if date.weekday() >= 5:  # 주말 제외
            continue

        variation = random.uniform(-3, 3)
        base_price = max(10, base_price + variation)

        open_price = base_price + random.uniform(-2, 2)
        close_price = base_price + random.uniform(-2, 2)
        high_price = max(open_price, close_price) + random.uniform(0, 2)
        low_price = min(open_price, close_price) - random.uniform(0, 2)

        result.append(ChartDataPoint(
            date=date.strftime("%Y-%m-%d"),
            open=round(open_price, 2),
            high=round(high_price, 2),
            low=round(low_price, 2),
            close=round(close_price, 2),
            volume=random.randint(1000000, 50000000)
        ))

    return result


@router.get("/{ticker}/news", response_model=List[StockNews])
async def get_stock_news(
    ticker: str,
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_active_user)
):
    """
    종목 관련 뉴스 조회

    Args:
        ticker: 종목 티커
        limit: 뉴스 개수 (최대 50개)

    Returns:
        관련 뉴스 리스트
    """
    try:
        logger.info(f"Fetching news for {ticker}")

        # TODO: 실제 뉴스 API 연동 (Alpha Vantage, NewsAPI 등)
        # 현재는 샘플 데이터 반환

        sample_news = [
            StockNews(
                id=f"news_{ticker}_{i}",
                title=f"{ticker} 주가 전망: 분기 실적 발표 앞두고 투자자 관심 집중",
                summary=f"{ticker}가 다가오는 분기 실적 발표를 앞두고 있습니다. 애널리스트들은 매출 성장과 수익성 개선에 주목하고 있으며...",
                source="Market Watch",
                url=f"https://example.com/news/{ticker}/{i}",
                published_at=(datetime.now() - timedelta(hours=i*3)).isoformat(),
                sentiment="positive" if i % 3 == 0 else ("negative" if i % 3 == 1 else "neutral")
            )
            for i in range(min(limit, 10))
        ]

        return sample_news

    except Exception as e:
        logger.error(f"Error fetching news for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/analysis", response_model=StockAnalysis)
async def get_stock_analysis(
    ticker: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    AI 종목 분석 정보 조회

    Args:
        ticker: 종목 티커

    Returns:
        AI 분석 결과 (추천, 목표가, 분석 요약 등)
    """
    try:
        logger.info(f"Fetching analysis for {ticker}")

        # 종목 정보 조회
        stock_info = await get_stock_info(ticker, current_user)

        # TODO: 실제 AI 분석 연동 (OpenAI, Claude 등)
        # 현재는 기본 정보 기반 샘플 분석 반환

        current_price = stock_info.current_price
        pe_ratio = stock_info.pe_ratio or 20

        # 간단한 분석 로직 (실제로는 AI 모델 사용)
        if pe_ratio < 15:
            recommendation = "buy"
            confidence = 0.75
        elif pe_ratio < 25:
            recommendation = "hold"
            confidence = 0.65
        else:
            recommendation = "sell"
            confidence = 0.60

        target_price = current_price * (1.15 if recommendation == "buy" else (0.95 if recommendation == "sell" else 1.05))

        return StockAnalysis(
            recommendation=recommendation,
            target_price=round(target_price, 2),
            confidence=confidence,
            analysis_summary=f"{ticker}는 현재 PER {pe_ratio:.1f}배로 거래되고 있습니다. "
                           f"{'저평가 구간에 있어 매수 기회가 될 수 있습니다.' if recommendation == 'buy' else '현재 가격대에서 보유 유지를 권장합니다.' if recommendation == 'hold' else '고평가 구간에 있어 일부 차익 실현을 고려해볼 수 있습니다.'}",
            key_factors=[
                "분기 실적 성장 기대",
                "시장 점유율 확대",
                "신규 제품 출시 예정",
                "업계 평균 대비 양호한 수익성"
            ],
            risks=[
                "금리 인상에 따른 할인율 상승",
                "경쟁 심화로 인한 마진 압박",
                "환율 변동 리스크"
            ],
            updated_at=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching analysis for {ticker}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{ticker}/position", response_model=Optional[UserPosition])
async def get_user_position(
    ticker: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    사용자의 해당 종목 보유 정보 조회

    Args:
        ticker: 종목 티커

    Returns:
        보유 정보 (없으면 null)
    """
    try:
        logger.info(f"Fetching user position for {ticker}")

        # KIS API에서 잔고 조회
        balance_data = kis_client.get_overseas_balance(user=current_user)

        if not balance_data or balance_data.get("rt_cd") != "0":
            return None

        output1 = balance_data.get("output1", [])

        # 해당 종목 찾기
        for item in output1:
            if item.get("ovrs_pdno", "").upper() == ticker.upper():
                quantity = int(item.get("ovrs_cblc_qty", 0))
                avg_price = float(item.get("pchs_avg_pric", 0))
                current_price = float(item.get("now_pric2", 0))
                market_value = float(item.get("ovrs_stck_evlu_amt", 0))
                profit_loss = float(item.get("frcr_evlu_pfls_amt", 0))
                profit_loss_percent = float(item.get("evlu_pfls_rt", 0))

                # 전체 포트폴리오 대비 비중 계산
                total_value = sum(float(p.get("ovrs_stck_evlu_amt", 0)) for p in output1)
                weight = (market_value / total_value * 100) if total_value > 0 else 0

                return UserPosition(
                    quantity=quantity,
                    avg_price=avg_price,
                    market_value=market_value,
                    profit_loss=profit_loss,
                    profit_loss_percent=profit_loss_percent,
                    weight=round(weight, 2)
                )

        return None

    except Exception as e:
        logger.error(f"Error fetching user position for {ticker}: {e}")
        return None
