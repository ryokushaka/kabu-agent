"""
리밸런싱 추천 API 라우터
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal
import logging
import json

from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.database.connection import get_db
from src.database.models import User, RebalanceRecommendation, Portfolio
from src.auth.dependencies import get_current_active_user
from src.kis_api import kis_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/rebalance", tags=["Rebalance"])


class AllocationItem(BaseModel):
    """포트폴리오 배분 항목"""
    ticker: str
    name: str
    current_weight: float
    target_weight: float
    difference: float
    current_value: float
    target_value: float
    action: str  # 'buy', 'sell', 'hold'
    shares_to_trade: int


class RebalanceRecommendationResponse(BaseModel):
    """리밸런싱 추천 응답"""
    id: str
    strategy: str
    risk_profile: str
    analysis_summary: str
    current_allocation: List[AllocationItem]
    suggested_allocation: List[AllocationItem]
    total_portfolio_value: float
    estimated_trades: int
    estimated_fees: float
    status: str
    created_at: str


class RebalanceHistoryItem(BaseModel):
    """리밸런싱 히스토리 항목"""
    id: str
    strategy: str
    status: str
    created_at: str


class RebalanceRequest(BaseModel):
    """리밸런싱 추천 요청"""
    strategy: str = "balanced"  # 'aggressive', 'balanced', 'conservative', 'custom'
    target_allocations: Optional[Dict[str, float]] = None  # custom strategy only


@router.post("/suggest", response_model=RebalanceRecommendationResponse)
async def suggest_rebalance(
    request: RebalanceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    AI 리밸런싱 추천 생성

    Args:
        request: 리밸런싱 요청 (전략 선택)

    Returns:
        리밸런싱 추천 결과
    """
    try:
        # 현재 포트폴리오 조회
        balance_data = kis_client.get_overseas_balance(user=current_user)

        if not balance_data or balance_data.get("rt_cd") != "0":
            raise HTTPException(status_code=400, detail="Failed to fetch portfolio data")

        output1 = balance_data.get("output1", [])

        if not output1:
            raise HTTPException(status_code=400, detail="No positions found in portfolio")

        # 현재 포트폴리오 분석
        total_value = sum(float(p.get("ovrs_stck_evlu_amt", 0)) for p in output1)

        current_allocation = []
        for item in output1:
            ticker = item.get("ovrs_pdno", "")
            market_value = float(item.get("ovrs_stck_evlu_amt", 0))
            weight = (market_value / total_value * 100) if total_value > 0 else 0

            current_allocation.append({
                "ticker": ticker,
                "name": item.get("ovrs_item_name", ticker),
                "weight": round(weight, 2),
                "value": market_value,
                "quantity": int(item.get("ovrs_cblc_qty", 0)),
                "current_price": float(item.get("now_pric2", 0))
            })

        # 전략에 따른 목표 배분 생성
        target_allocation = _generate_target_allocation(
            current_allocation,
            request.strategy,
            request.target_allocations,
            total_value
        )

        # 추천 항목 생성
        suggested_items = []
        for item in target_allocation:
            current = next(
                (c for c in current_allocation if c["ticker"] == item["ticker"]),
                {"weight": 0, "value": 0}
            )

            difference = item["target_weight"] - current["weight"]
            target_value = total_value * (item["target_weight"] / 100)

            if difference > 1:
                action = "buy"
            elif difference < -1:
                action = "sell"
            else:
                action = "hold"

            # 거래 수량 계산
            price = item.get("current_price", current.get("current_price", 1))
            value_diff = target_value - current["value"]
            shares_to_trade = int(abs(value_diff) / price) if price > 0 else 0

            suggested_items.append(AllocationItem(
                ticker=item["ticker"],
                name=item["name"],
                current_weight=current["weight"],
                target_weight=item["target_weight"],
                difference=round(difference, 2),
                current_value=current["value"],
                target_value=round(target_value, 2),
                action=action,
                shares_to_trade=shares_to_trade
            ))

        # 거래 필요 종목 수
        estimated_trades = sum(1 for s in suggested_items if s.action != "hold")

        # 예상 수수료 (0.1% 가정)
        estimated_fees = sum(
            abs(s.target_value - s.current_value) * 0.001
            for s in suggested_items if s.action != "hold"
        )

        # 분석 요약 생성
        analysis_summary = _generate_analysis_summary(
            request.strategy,
            suggested_items,
            total_value
        )

        # DB에 추천 저장
        recommendation_data = {
            "strategy": request.strategy,
            "analysis_summary": analysis_summary,
            "suggested_items": [s.model_dump() for s in suggested_items],
            "total_value": total_value
        }

        current_data = {
            "items": current_allocation,
            "total_value": total_value
        }

        suggested_data = {
            "items": [s.model_dump() for s in suggested_items],
            "total_value": total_value
        }

        new_recommendation = RebalanceRecommendation(
            user_id=current_user.id,
            recommendation_data=json.dumps(recommendation_data),
            current_allocation=json.dumps(current_data),
            suggested_allocation=json.dumps(suggested_data),
            status="pending"
        )

        db.add(new_recommendation)
        db.commit()
        db.refresh(new_recommendation)

        # 현재 배분을 AllocationItem으로 변환
        current_items = [
            AllocationItem(
                ticker=c["ticker"],
                name=c["name"],
                current_weight=c["weight"],
                target_weight=c["weight"],
                difference=0,
                current_value=c["value"],
                target_value=c["value"],
                action="hold",
                shares_to_trade=0
            )
            for c in current_allocation
        ]

        return RebalanceRecommendationResponse(
            id=str(new_recommendation.id),
            strategy=request.strategy,
            risk_profile=_get_risk_profile(request.strategy),
            analysis_summary=analysis_summary,
            current_allocation=current_items,
            suggested_allocation=suggested_items,
            total_portfolio_value=round(total_value, 2),
            estimated_trades=estimated_trades,
            estimated_fees=round(estimated_fees, 2),
            status="pending",
            created_at=new_recommendation.created_at.isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating rebalance recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _generate_target_allocation(
    current_allocation: List[Dict],
    strategy: str,
    custom_targets: Optional[Dict[str, float]],
    total_value: float
) -> List[Dict]:
    """전략에 따른 목표 배분 생성"""

    if strategy == "custom" and custom_targets:
        result = []
        for ticker, weight in custom_targets.items():
            current = next((c for c in current_allocation if c["ticker"] == ticker), None)
            if current:
                result.append({
                    **current,
                    "target_weight": weight
                })
        return result

    # 기본 전략별 배분 규칙
    n = len(current_allocation)
    if n == 0:
        return []

    result = []

    if strategy == "equal_weight":
        # 동일 비중
        equal_weight = 100 / n
        for item in current_allocation:
            result.append({
                **item,
                "target_weight": round(equal_weight, 2)
            })

    elif strategy == "aggressive":
        # 공격형: 성장주 비중 높임 (현재 비중 대비 상위 종목 강화)
        sorted_items = sorted(current_allocation, key=lambda x: x["weight"], reverse=True)

        for i, item in enumerate(sorted_items):
            if i < n // 3:  # 상위 33% 종목
                target = item["weight"] * 1.2
            elif i < 2 * n // 3:  # 중간 33%
                target = item["weight"]
            else:  # 하위 33%
                target = item["weight"] * 0.8

            result.append({**item, "target_weight": round(target, 2)})

        # 정규화
        total = sum(r["target_weight"] for r in result)
        for r in result:
            r["target_weight"] = round(r["target_weight"] / total * 100, 2)

    elif strategy == "conservative":
        # 보수형: 균등 배분에 가깝게, 변동성 줄임
        avg_weight = 100 / n
        for item in current_allocation:
            # 현재 비중과 평균의 중간값
            target = (item["weight"] + avg_weight) / 2
            result.append({**item, "target_weight": round(target, 2)})

        # 정규화
        total = sum(r["target_weight"] for r in result)
        for r in result:
            r["target_weight"] = round(r["target_weight"] / total * 100, 2)

    else:  # balanced
        # 균형형: 약간의 조정만
        for item in current_allocation:
            target = item["weight"]
            # 과도한 집중 해소 (25% 이상이면 줄임)
            if target > 25:
                target = 25
            # 너무 적은 비중 보강 (3% 미만이면 늘림)
            elif target < 3 and target > 0:
                target = 5

            result.append({**item, "target_weight": round(target, 2)})

        # 정규화
        total = sum(r["target_weight"] for r in result)
        for r in result:
            r["target_weight"] = round(r["target_weight"] / total * 100, 2)

    return result


def _get_risk_profile(strategy: str) -> str:
    """전략에 따른 위험 프로필 반환"""
    profiles = {
        "aggressive": "공격형 (고위험/고수익)",
        "balanced": "균형형 (중위험/중수익)",
        "conservative": "보수형 (저위험/안정)",
        "equal_weight": "동일 비중",
        "custom": "사용자 정의"
    }
    return profiles.get(strategy, "균형형")


def _generate_analysis_summary(
    strategy: str,
    suggested_items: List[AllocationItem],
    total_value: float
) -> str:
    """분석 요약 생성"""

    buy_items = [s for s in suggested_items if s.action == "buy"]
    sell_items = [s for s in suggested_items if s.action == "sell"]

    summary_parts = []

    if strategy == "equal_weight":
        summary_parts.append("동일 비중 전략을 적용하여 모든 종목의 비중을 균등하게 조정합니다.")
    elif strategy == "aggressive":
        summary_parts.append("공격형 전략으로 성과가 좋은 종목의 비중을 높이고, 수익률이 낮은 종목을 줄입니다.")
    elif strategy == "conservative":
        summary_parts.append("보수형 전략으로 포트폴리오의 변동성을 줄이기 위해 종목 간 비중을 평준화합니다.")
    else:
        summary_parts.append("균형형 전략으로 과도한 집중을 해소하고 적정 비중을 유지합니다.")

    if buy_items:
        buy_tickers = ", ".join(s.ticker for s in buy_items[:3])
        summary_parts.append(f"매수 추천: {buy_tickers}")

    if sell_items:
        sell_tickers = ", ".join(s.ticker for s in sell_items[:3])
        summary_parts.append(f"매도 추천: {sell_tickers}")

    summary_parts.append(f"현재 포트폴리오 총 가치: ${total_value:,.2f}")

    return " ".join(summary_parts)


@router.get("/history", response_model=List[RebalanceHistoryItem])
async def get_rebalance_history(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    과거 리밸런싱 추천 이력 조회

    Args:
        limit: 조회 개수

    Returns:
        추천 이력 리스트
    """
    try:
        recommendations = db.query(RebalanceRecommendation).filter(
            RebalanceRecommendation.user_id == current_user.id
        ).order_by(desc(RebalanceRecommendation.created_at)).limit(limit).all()

        result = []
        for rec in recommendations:
            try:
                data = json.loads(rec.recommendation_data)
                strategy = data.get("strategy", "unknown")
            except:
                strategy = "unknown"

            result.append(RebalanceHistoryItem(
                id=str(rec.id),
                strategy=strategy,
                status=rec.status,
                created_at=rec.created_at.isoformat()
            ))

        return result

    except Exception as e:
        logger.error(f"Error fetching rebalance history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{recommendation_id}", response_model=RebalanceRecommendationResponse)
async def get_rebalance_detail(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    리밸런싱 추천 상세 조회

    Args:
        recommendation_id: 추천 ID

    Returns:
        추천 상세 정보
    """
    try:
        recommendation = db.query(RebalanceRecommendation).filter(
            RebalanceRecommendation.id == recommendation_id,
            RebalanceRecommendation.user_id == current_user.id
        ).first()

        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        rec_data = json.loads(recommendation.recommendation_data)
        current_data = json.loads(recommendation.current_allocation)
        suggested_data = json.loads(recommendation.suggested_allocation)

        current_items = [
            AllocationItem(**item) if isinstance(item, dict) else item
            for item in current_data.get("items", [])
        ]

        suggested_items = [
            AllocationItem(**item) if isinstance(item, dict) else item
            for item in suggested_data.get("items", [])
        ]

        estimated_trades = sum(1 for s in suggested_items if s.action != "hold")
        estimated_fees = sum(
            abs(s.target_value - s.current_value) * 0.001
            for s in suggested_items if s.action != "hold"
        )

        return RebalanceRecommendationResponse(
            id=str(recommendation.id),
            strategy=rec_data.get("strategy", "balanced"),
            risk_profile=_get_risk_profile(rec_data.get("strategy", "balanced")),
            analysis_summary=rec_data.get("analysis_summary", ""),
            current_allocation=current_items,
            suggested_allocation=suggested_items,
            total_portfolio_value=rec_data.get("total_value", 0),
            estimated_trades=estimated_trades,
            estimated_fees=round(estimated_fees, 2),
            status=recommendation.status,
            created_at=recommendation.created_at.isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching rebalance detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{recommendation_id}/apply")
async def apply_recommendation(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    리밸런싱 추천 적용 표시

    Args:
        recommendation_id: 추천 ID

    Returns:
        처리 결과
    """
    try:
        recommendation = db.query(RebalanceRecommendation).filter(
            RebalanceRecommendation.id == recommendation_id,
            RebalanceRecommendation.user_id == current_user.id
        ).first()

        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        recommendation.status = "applied"
        db.commit()

        return {"success": True, "message": "Recommendation marked as applied"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    리밸런싱 추천 무시

    Args:
        recommendation_id: 추천 ID

    Returns:
        처리 결과
    """
    try:
        recommendation = db.query(RebalanceRecommendation).filter(
            RebalanceRecommendation.id == recommendation_id,
            RebalanceRecommendation.user_id == current_user.id
        ).first()

        if not recommendation:
            raise HTTPException(status_code=404, detail="Recommendation not found")

        recommendation.status = "dismissed"
        db.commit()

        return {"success": True, "message": "Recommendation dismissed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error dismissing recommendation: {e}")
        raise HTTPException(status_code=500, detail=str(e))
