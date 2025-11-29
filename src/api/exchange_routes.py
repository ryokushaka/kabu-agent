"""
환율 API 라우터
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import logging
import requests
from typing import Dict

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/exchange", tags=["Exchange Rate"])


class ExchangeRate(BaseModel):
    """환율 정보 모델"""
    base_currency: str
    target_currency: str
    rate: float
    timestamp: str
    source: str


@router.get("/rate/{base_currency}/{target_currency}", response_model=ExchangeRate)
async def get_exchange_rate(base_currency: str, target_currency: str):
    """
    환율 조회
    
    Args:
        base_currency: 기준 통화 (예: USD)
        target_currency: 대상 통화 (예: KRW)
        
    Returns:
        실시간 환율 정보
    """
    try:
        logger.info(f"환율 조회: {base_currency} -> {target_currency}")
        
        # 무료 환율 API 사용 (exchangerate-api.com)
        url = f"https://api.exchangerate-api.com/v4/latest/{base_currency.upper()}"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        target_upper = target_currency.upper()
        if target_upper not in data.get("rates", {}):
            raise HTTPException(status_code=404, detail=f"환율 정보를 찾을 수 없습니다: {target_currency}")
        
        rate = data["rates"][target_upper]
        
        result = ExchangeRate(
            base_currency=base_currency.upper(),
            target_currency=target_currency.upper(),
            rate=rate,
            timestamp=data.get("date", ""),
            source="exchangerate-api.com"
        )
        
        logger.info(f"환율 조회 성공: {base_currency}/{target_currency} = {rate}")
        return result
        
    except requests.RequestException as e:
        logger.error(f"환율 API 호출 실패: {e}")
        raise HTTPException(status_code=503, detail="환율 서비스에 접근할 수 없습니다")
    except Exception as e:
        logger.error(f"환율 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rates", response_model=Dict[str, float])
async def get_major_exchange_rates():
    """
    주요 환율 정보 일괄 조회
    
    Returns:
        USD 기준 주요 환율 정보
    """
    try:
        logger.info("주요 환율 일괄 조회")
        
        url = "https://api.exchangerate-api.com/v4/latest/USD"
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # 주요 통화만 필터링
        major_currencies = ["KRW", "EUR", "JPY", "GBP", "CAD", "AUD", "CHF", "CNY"]
        rates = {currency: data["rates"].get(currency, 0) for currency in major_currencies}
        
        logger.info(f"주요 환율 조회 성공: {len(rates)}개 통화")
        return rates
        
    except requests.RequestException as e:
        logger.error(f"환율 API 호출 실패: {e}")
        raise HTTPException(status_code=503, detail="환율 서비스에 접근할 수 없습니다")
    except Exception as e:
        logger.error(f"주요 환율 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))