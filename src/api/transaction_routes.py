"""
거래 내역 API 라우터
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta, date
from decimal import Decimal
import logging
import io
import csv

from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from src.database.connection import get_db
from src.database.models import User, Transaction, Portfolio
from src.auth.dependencies import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


class TransactionResponse(BaseModel):
    """거래 내역 응답"""
    id: str
    ticker: str
    transaction_type: str  # 'BUY', 'SELL'
    quantity: int
    price: float
    total_amount: float
    fees: float
    transaction_date: str
    created_at: str

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """거래 내역 목록 응답"""
    transactions: List[TransactionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TransactionStats(BaseModel):
    """거래 통계"""
    total_buy_amount: float
    total_sell_amount: float
    total_fees: float
    realized_profit_loss: float
    transaction_count: int
    buy_count: int
    sell_count: int
    most_traded_ticker: Optional[str] = None
    avg_transaction_amount: float


class TransactionSummaryByTicker(BaseModel):
    """종목별 거래 요약"""
    ticker: str
    buy_count: int
    sell_count: int
    total_bought_quantity: int
    total_sold_quantity: int
    total_buy_amount: float
    total_sell_amount: float
    avg_buy_price: float
    avg_sell_price: float
    realized_profit_loss: float


@router.get("", response_model=TransactionListResponse)
async def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    transaction_type: Optional[str] = Query(None, description="BUY or SELL"),
    ticker: Optional[str] = None,
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    거래 내역 목록 조회

    Args:
        page: 페이지 번호
        page_size: 페이지당 항목 수
        transaction_type: 거래 유형 (BUY/SELL)
        ticker: 종목 코드
        start_date: 시작일 (YYYY-MM-DD)
        end_date: 종료일 (YYYY-MM-DD)

    Returns:
        거래 내역 목록 (페이지네이션)
    """
    try:
        # 사용자의 포트폴리오 조회
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()

        if not portfolio:
            return TransactionListResponse(
                transactions=[],
                total=0,
                page=page,
                page_size=page_size,
                total_pages=0
            )

        # 기본 쿼리
        query = db.query(Transaction).filter(Transaction.portfolio_id == portfolio.id)

        # 필터 적용
        if transaction_type:
            query = query.filter(Transaction.transaction_type == transaction_type.upper())

        if ticker:
            query = query.filter(Transaction.ticker == ticker.upper())

        if start_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(Transaction.transaction_date >= start)
            except ValueError:
                pass

        if end_date:
            try:
                end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(Transaction.transaction_date < end)
            except ValueError:
                pass

        # 총 개수
        total = query.count()

        # 페이지네이션
        transactions = query.order_by(desc(Transaction.transaction_date)).offset(
            (page - 1) * page_size
        ).limit(page_size).all()

        # 응답 생성
        transaction_list = [
            TransactionResponse(
                id=str(t.id),
                ticker=t.ticker,
                transaction_type=t.transaction_type,
                quantity=t.quantity,
                price=float(t.price),
                total_amount=float(t.total_amount),
                fees=float(t.fees) if t.fees else 0,
                transaction_date=t.transaction_date.isoformat(),
                created_at=t.created_at.isoformat()
            )
            for t in transactions
        ]

        total_pages = (total + page_size - 1) // page_size

        return TransactionListResponse(
            transactions=transaction_list,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )

    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=TransactionStats)
async def get_transaction_stats(
    period: str = Query("1M", description="1W, 1M, 3M, 6M, 1Y, ALL"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    거래 통계 조회

    Args:
        period: 조회 기간 (1W, 1M, 3M, 6M, 1Y, ALL)

    Returns:
        기간별 거래 통계
    """
    try:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()

        if not portfolio:
            return TransactionStats(
                total_buy_amount=0,
                total_sell_amount=0,
                total_fees=0,
                realized_profit_loss=0,
                transaction_count=0,
                buy_count=0,
                sell_count=0,
                most_traded_ticker=None,
                avg_transaction_amount=0
            )

        # 기간 계산
        period_days = {
            "1W": 7,
            "1M": 30,
            "3M": 90,
            "6M": 180,
            "1Y": 365,
            "ALL": 36500
        }
        days = period_days.get(period.upper(), 30)
        start_date = datetime.now() - timedelta(days=days)

        # 기본 쿼리
        query = db.query(Transaction).filter(
            Transaction.portfolio_id == portfolio.id,
            Transaction.transaction_date >= start_date
        )

        transactions = query.all()

        if not transactions:
            return TransactionStats(
                total_buy_amount=0,
                total_sell_amount=0,
                total_fees=0,
                realized_profit_loss=0,
                transaction_count=0,
                buy_count=0,
                sell_count=0,
                most_traded_ticker=None,
                avg_transaction_amount=0
            )

        # 통계 계산
        total_buy_amount = sum(float(t.total_amount) for t in transactions if t.transaction_type == 'BUY')
        total_sell_amount = sum(float(t.total_amount) for t in transactions if t.transaction_type == 'SELL')
        total_fees = sum(float(t.fees) if t.fees else 0 for t in transactions)
        buy_count = sum(1 for t in transactions if t.transaction_type == 'BUY')
        sell_count = sum(1 for t in transactions if t.transaction_type == 'SELL')

        # 실현 손익 (단순: 매도액 - 매수액)
        realized_profit_loss = total_sell_amount - (total_buy_amount * (sell_count / (buy_count or 1)))

        # 가장 많이 거래한 종목
        ticker_counts = {}
        for t in transactions:
            ticker_counts[t.ticker] = ticker_counts.get(t.ticker, 0) + 1
        most_traded_ticker = max(ticker_counts, key=ticker_counts.get) if ticker_counts else None

        avg_transaction_amount = (total_buy_amount + total_sell_amount) / len(transactions) if transactions else 0

        return TransactionStats(
            total_buy_amount=round(total_buy_amount, 2),
            total_sell_amount=round(total_sell_amount, 2),
            total_fees=round(total_fees, 2),
            realized_profit_loss=round(realized_profit_loss, 2),
            transaction_count=len(transactions),
            buy_count=buy_count,
            sell_count=sell_count,
            most_traded_ticker=most_traded_ticker,
            avg_transaction_amount=round(avg_transaction_amount, 2)
        )

    except Exception as e:
        logger.error(f"Error fetching transaction stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary-by-ticker", response_model=List[TransactionSummaryByTicker])
async def get_transaction_summary_by_ticker(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    종목별 거래 요약 조회

    Returns:
        종목별 거래 요약 리스트
    """
    try:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()

        if not portfolio:
            return []

        transactions = db.query(Transaction).filter(
            Transaction.portfolio_id == portfolio.id
        ).all()

        # 종목별 집계
        ticker_data: Dict[str, Dict] = {}

        for t in transactions:
            if t.ticker not in ticker_data:
                ticker_data[t.ticker] = {
                    "buy_count": 0,
                    "sell_count": 0,
                    "total_bought_quantity": 0,
                    "total_sold_quantity": 0,
                    "total_buy_amount": 0,
                    "total_sell_amount": 0
                }

            data = ticker_data[t.ticker]

            if t.transaction_type == "BUY":
                data["buy_count"] += 1
                data["total_bought_quantity"] += t.quantity
                data["total_buy_amount"] += float(t.total_amount)
            else:
                data["sell_count"] += 1
                data["total_sold_quantity"] += t.quantity
                data["total_sell_amount"] += float(t.total_amount)

        # 응답 생성
        result = []
        for ticker, data in ticker_data.items():
            avg_buy_price = data["total_buy_amount"] / data["total_bought_quantity"] if data["total_bought_quantity"] > 0 else 0
            avg_sell_price = data["total_sell_amount"] / data["total_sold_quantity"] if data["total_sold_quantity"] > 0 else 0

            # 실현 손익 계산 (매도된 주식 기준)
            realized_pl = 0
            if data["total_sold_quantity"] > 0:
                cost_basis = avg_buy_price * data["total_sold_quantity"]
                realized_pl = data["total_sell_amount"] - cost_basis

            result.append(TransactionSummaryByTicker(
                ticker=ticker,
                buy_count=data["buy_count"],
                sell_count=data["sell_count"],
                total_bought_quantity=data["total_bought_quantity"],
                total_sold_quantity=data["total_sold_quantity"],
                total_buy_amount=round(data["total_buy_amount"], 2),
                total_sell_amount=round(data["total_sell_amount"], 2),
                avg_buy_price=round(avg_buy_price, 4),
                avg_sell_price=round(avg_sell_price, 4),
                realized_profit_loss=round(realized_pl, 2)
            ))

        # 거래량 기준 정렬
        result.sort(key=lambda x: x.total_bought_quantity + x.total_sold_quantity, reverse=True)

        return result

    except Exception as e:
        logger.error(f"Error fetching transaction summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_detail(
    transaction_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    거래 상세 조회

    Args:
        transaction_id: 거래 ID

    Returns:
        거래 상세 정보
    """
    try:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()

        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")

        transaction = db.query(Transaction).filter(
            Transaction.id == transaction_id,
            Transaction.portfolio_id == portfolio.id
        ).first()

        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")

        return TransactionResponse(
            id=str(transaction.id),
            ticker=transaction.ticker,
            transaction_type=transaction.transaction_type,
            quantity=transaction.quantity,
            price=float(transaction.price),
            total_amount=float(transaction.total_amount),
            fees=float(transaction.fees) if transaction.fees else 0,
            transaction_date=transaction.transaction_date.isoformat(),
            created_at=transaction.created_at.isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching transaction detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export/csv")
async def export_transactions_csv(
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    거래 내역 CSV 내보내기

    Args:
        start_date: 시작일
        end_date: 종료일

    Returns:
        CSV 파일 다운로드
    """
    try:
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).first()

        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")

        query = db.query(Transaction).filter(Transaction.portfolio_id == portfolio.id)

        if start_date:
            try:
                start = datetime.strptime(start_date, "%Y-%m-%d")
                query = query.filter(Transaction.transaction_date >= start)
            except ValueError:
                pass

        if end_date:
            try:
                end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
                query = query.filter(Transaction.transaction_date < end)
            except ValueError:
                pass

        transactions = query.order_by(desc(Transaction.transaction_date)).all()

        # CSV 생성
        output = io.StringIO()
        writer = csv.writer(output)

        # 헤더
        writer.writerow([
            "거래일시", "종목코드", "거래유형", "수량", "단가", "거래금액", "수수료"
        ])

        # 데이터
        for t in transactions:
            writer.writerow([
                t.transaction_date.strftime("%Y-%m-%d %H:%M:%S"),
                t.ticker,
                "매수" if t.transaction_type == "BUY" else "매도",
                t.quantity,
                f"{float(t.price):.4f}",
                f"{float(t.total_amount):.2f}",
                f"{float(t.fees):.2f}" if t.fees else "0.00"
            ])

        output.seek(0)

        filename = f"transactions_{datetime.now().strftime('%Y%m%d')}.csv"

        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
