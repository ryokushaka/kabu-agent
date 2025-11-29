"""
KIS Open API 클라이언트
"""
import logging
import requests
import json
import os
from datetime import datetime, timedelta
from typing import Dict, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from urllib3.poolmanager import PoolManager
import ssl
from config.settings import settings, get_kis_headers, get_api_base_url
from src.utils import safe_int_convert


logger = logging.getLogger(__name__)


class TLS12Adapter(HTTPAdapter):
    """TLS 1.2를 강제하는 HTTP Adapter"""
    def init_poolmanager(self, connections, maxsize, block=False, **pool_kwargs):
        ctx = ssl.create_default_context()
        ctx.minimum_version = ssl.TLSVersion.TLSv1_2
        ctx.maximum_version = ssl.TLSVersion.TLSv1_2
        self.poolmanager = PoolManager(
            num_pools=connections,
            maxsize=maxsize,
            block=block,
            ssl_context=ctx,
            **pool_kwargs
        )


class KISApiClient:
    """KIS Open API 클라이언트"""
    
    def __init__(self):
        self.base_url = get_api_base_url()
        self.access_token: Optional[str] = None
        self.token_expires_at: Optional[datetime] = None
        self._cached_headers = {}
        self._session = self._create_session()
    
    def _create_session(self) -> requests.Session:
        """최적화된 세션 생성 (연결 풀링 및 재시도)"""
        session = requests.Session()
        
        # 재시도 전략 설정
        retry_strategy = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        
        adapter = TLS12Adapter(max_retries=retry_strategy, pool_maxsize=10)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        return session
        
    def authenticate(self) -> bool:
        """API 인증 토큰 획득"""
        try:
            url = f"{self.base_url}/oauth2/tokenP"
            headers = {
                "Content-Type": "application/json"
            }
            data = {
                "grant_type": "client_credentials",
                "appkey": settings.KIS_APP_KEY,
                "appsecret": settings.KIS_APP_SECRET
            }
            
            response = self._session.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("access_token"):
                self.access_token = result["access_token"]
                # 토큰 만료시간 설정 (보통 24시간)
                expires_in = safe_int_convert(str(result.get("expires_in", 86400)))
                self.token_expires_at = datetime.now() + timedelta(seconds=expires_in)
                
                logger.info("KIS API 인증 성공")
                return True
            else:
                logger.error(f"인증 실패: {result}")
                return False
                
        except Exception as e:
            logger.error(f"인증 중 오류 발생: {e}")
            return False
    
    def _is_token_valid(self) -> bool:
        """토큰 유효성 확인 (만료 5분 전에 갱신)"""
        if not self.access_token or not self.token_expires_at:
            return False
        # 토큰이 만료되기 5분 전에 미리 갱신하도록 함
        return datetime.now() < (self.token_expires_at - timedelta(minutes=5))
    
    def _get_headers(self, tr_id: str) -> Dict[str, str]:
        """API 호출용 헤더 생성 (캐시 최적화)"""
        # 토큰이 유효하지 않거나 캐시된 헤더가 없는 경우
        if not self._is_token_valid() or not self._cached_headers:
            if not self.authenticate():
                raise Exception("인증 실패")
            # 기본 헤더 캐시 업데이트
            self._cached_headers = get_kis_headers()
            self._cached_headers["authorization"] = f"Bearer {self.access_token}"
        
        # TR ID만 동적으로 설정
        headers = self._cached_headers.copy()
        headers["tr_id"] = tr_id
        return headers
    
    def get_overseas_balance(self) -> Dict:
        """해외주식 잔고 조회 (계좌번호 필수)"""
        try:
            # 계좌번호 검증 및 설정
            if not settings.KIS_ACCOUNT_NUMBER:
                raise ValueError("계좌번호가 설정되지 않았습니다.")
            
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading/inquire-balance"
            # TR_ID 설정 (실전/모의투자 구분)
            tr_id = "VTTS3012R" if settings.TRADING_ENV == "virtual" else "TTTS3012R"
            headers = self._get_headers(tr_id)  # 해외주식 잔고조회
            
            # 계좌번호 처리
            cano = settings.KIS_ACCOUNT_NUMBER[:8]
            acnt_prdt_cd = settings.KIS_ACCOUNT_NUMBER[8:]
            
            params = {
                "CANO": cano,
                "ACNT_PRDT_CD": acnt_prdt_cd,
                "OVRS_EXCG_CD": "NASD",  # 해외거래소코드 (NASD: 나스닥)
                "TR_CRCY_CD": "USD",     # 거래통화코드
                "CTX_AREA_FK200": "",    # 연속조회검색조건
                "CTX_AREA_NK200": ""     # 연속조회키
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info("해외주식 잔고 조회 성공")
            return result
            
        except ValueError as e:
            logger.warning(f"계좌번호 검증 실패: {e}")
            return {"rt_cd": "1", "msg1": str(e), "requires_account": True}
        except Exception as e:
            logger.error(f"해외주식 잔고 조회 실패: {e}")
            raise
    
    def get_overseas_news(self, limit: int = 20) -> Dict:
        """해외 속보 뉴스 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-price/v1/quotations/brknews-title"
            headers = self._get_headers("HHDFS76200100")  # 해외주식 속보 (원래 TR_ID로 복원)
            
            params = {
                "EXCD": "NASD",     # 거래소 코드 (필수)
                "GUBN": "0",        # 구분 (0: 전체)
                "LANG": "ko",       # 언어
                "CNTS": str(limit), # 조회 건수
                "BYMD": ""          # 기준일자 (공백 가능)
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info("해외 속보 뉴스 조회 성공")
            return result
            
        except Exception as e:
            logger.error(f"해외 속보 뉴스 조회 실패: {e}")
            raise
    
    def get_overseas_stock_price(self, symbol: str, exchange: str = "NASD") -> Dict:
        """해외주식 현재가 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-price/v1/quotations/price"
            headers = self._get_headers("HHDFS00000300")  # 해외주식 현재가 (원래 TR_ID로 복원)
            
            params = {
                "SYMB": symbol,      # 종목코드  
                "EXCD": exchange,    # 거래소코드
                "GUBN": "0",         # 구분 (0: 기본)
                "BYMD": "",          # 기준일자 (공백 가능)
                "MODP": "1"          # 가격 구분 (1: 기본)
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"{symbol} 현재가 조회 성공")
            return result
            
        except Exception as e:
            logger.error(f"{symbol} 현재가 조회 실패: {e}")
            raise
    
    def get_overseas_trading_history(self, start_date: str, end_date: str, exchange: str = "NASD") -> Dict:
        """해외주식 거래내역 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading/inquire-ccnl"
            headers = self._get_headers("JTTT3018R")  # 해외주식 거래내역조회
            
            params = {
                "CANO": settings.KIS_ACCOUNT_NUMBER[:8],  # 계좌번호 앞 8자리
                "ACNT_PRDT_CD": settings.KIS_ACCOUNT_NUMBER[8:],  # 계좌번호 뒤 2자리
                "OVRS_EXCG_CD": exchange,  # 해외거래소코드
                "SORT_SQN": "DS",          # 정렬순서 (DS: 내림차순)
                "ORD_DT": start_date,      # 주문일자 (YYYYMMDD)
                "ORD_GNO_BRNO": "",        # 주문채번지점번호
                "ODNO": "",                # 주문번호
                "CTX_AREA_FK200": "",      # 연속조회검색조건200
                "CTX_AREA_NK200": ""       # 연속조회키200
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"해외주식 거래내역 조회 성공 ({start_date}~{end_date})")
            return result
            
        except Exception as e:
            logger.error(f"해외주식 거래내역 조회 실패: {e}")
            raise
    
    def get_overseas_daily_order_history(self, date: str, exchange: str = "NASD") -> Dict:
        """해외주식 일별 주문체결내역 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading/inquire-daily-ccld"
            headers = self._get_headers("JTTT3014R")  # 해외주식 일별주문체결조회
            
            params = {
                "CANO": settings.KIS_ACCOUNT_NUMBER[:8],  # 계좌번호 앞 8자리
                "ACNT_PRDT_CD": settings.KIS_ACCOUNT_NUMBER[8:],  # 계좌번호 뒤 2자리
                "OVRS_EXCG_CD": exchange,  # 해외거래소코드
                "TR_CRCY_CD": "USD",       # 거래통화코드
                "ORD_DT": date,            # 주문일자 (YYYYMMDD)
                "CTX_AREA_FK200": "",      # 연속조회검색조건200
                "CTX_AREA_NK200": ""       # 연속조회키200
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"일별 거래내역 조회 성공 ({date})")
            return result
            
        except Exception as e:
            logger.error(f"일별 거래내역 조회 실패: {e}")
            raise
    
    def get_overseas_news_detailed(self, exchange: str = "NASD", limit: int = 50) -> Dict:
        """해외 상세 뉴스 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-price/v1/quotations/brknews-title"
            headers = self._get_headers("HHDFS76200100")  # 해외주식 속보
            
            params = {
                "EXCD": exchange,      # 거래소 코드
                "GUBN": "0",           # 구분 (0: 전체)
                "LANG": "ko",          # 언어
                "CNTS": str(limit),    # 조회 건수
                "BYMD": ""             # 기준일자 (공백 가능)
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"해외 상세 뉴스 조회 성공 ({limit}건)")
            return result
            
        except Exception as e:
            logger.error(f"해외 상세 뉴스 조회 실패: {e}")
            raise
    
    def get_overseas_index_price(self, index_code: str = "NAS") -> Dict:
        """해외지수 현재가 조회"""
        try:
            url = f"{self.base_url}/uapi/overseas-price/v1/quotations/index-price"
            headers = self._get_headers("HHDFS76410000")  # 해외지수 현재가
            
            params = {
                "EXCD": index_code,    # 지수코드 (NAS: 나스닥, DOW: 다우존스, SPX: S&P500)
                "SYMB": "",            # 종목코드 (지수의 경우 공백)
                "GUBN": "0",           # 구분
                "BYMD": ""             # 기준일자
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"해외지수 현재가 조회 성공 ({index_code})")
            return result
            
        except Exception as e:
            logger.error(f"해외지수 현재가 조회 실패: {e}")
            raise
    
    def get_overseas_stock_rights(self, symbol: str, country: str = "US") -> Dict:
        """해외주식 권리종합 조회 (섹터 정보 포함)"""
        try:
            url = f"{self.base_url}/uapi/overseas-price/v1/quotations/rights-by-ice"
            headers = self._get_headers("HHDFS78330900")  # 해외주식 권리종합
            
            params = {
                "NCOD": country,    # 국가코드 (US: 미국, JP: 일본, HK: 홍콩 등)
                "SYMB": symbol,     # 종목코드
                "ST_YMD": "",       # 시작일자 (공백 시 3개월 전)
                "ED_YMD": ""        # 종료일자 (공백 시 3개월 후)
            }
            
            response = self._session.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            logger.info(f"{symbol} 권리정보 조회 성공")
            return result
            
        except Exception as e:
            logger.error(f"{symbol} 권리정보 조회 실패: {e}")
            # 실패 시 빈 결과 반환
            return {"rt_cd": "1", "msg1": "조회 실패", "output1": []}


# 글로벌 클라이언트 인스턴스
kis_client = KISApiClient()