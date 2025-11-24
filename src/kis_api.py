"""
KIS Open API 클라이언트
"""
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, Optional
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from config.settings import settings, get_kis_headers, get_api_base_url
from src.utils import safe_int_convert


logger = logging.getLogger(__name__)


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
        
        adapter = HTTPAdapter(max_retries=retry_strategy, pool_maxsize=10)
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
        """토큰 유효성 확인"""
        if not self.access_token or not self.token_expires_at:
            return False
        return datetime.now() < self.token_expires_at
    
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
            # 계좌번호 검증
            if not settings.KIS_ACCOUNT_NUMBER or len(settings.KIS_ACCOUNT_NUMBER) < 10:
                raise ValueError("유효한 계좌번호가 필요합니다. (10자리)")
            
            url = f"{self.base_url}/uapi/overseas-stock/v1/trading/inquire-balance"
            headers = self._get_headers("JTTT3012R")  # 해외주식 잔고조회
            
            params = {
                "CANO": settings.KIS_ACCOUNT_NUMBER[:8],  # 계좌번호 앞 8자리
                "ACNT_PRDT_CD": settings.KIS_ACCOUNT_NUMBER[8:],  # 계좌번호 뒤 2자리
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


# 글로벌 클라이언트 인스턴스
kis_client = KISApiClient()