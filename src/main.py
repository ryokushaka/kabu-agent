"""
KIS 데이터 취득 메인 모듈
"""
import json
import logging
from datetime import datetime
from typing import Dict, Optional

from src.utils import setup_logging, setup_project_path

# 프로젝트 루트 경로 설정
setup_project_path()

from src.kis_api import kis_client
from config.settings import settings




class DataAcquisitionService:
    """데이터 취득 서비스"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def get_account_data(self) -> Dict:
        """계좌 데이터 취득 메인 프로세스"""
        try:
            self.logger.info("계좌 데이터 취득 프로세스 시작")
            
            # 1. KIS API 인증
            self.logger.info("1. KIS API 인증 중...")
            if not self._authenticate():
                return {"error": "API 인증 실패", "success": False}
            
            # 2. 잔고 데이터 수집
            self.logger.info("2. 해외주식 잔고 데이터 수집 중...")
            balance_data = self._fetch_balance_data()
            if not balance_data or "error" in balance_data:
                return {"error": "잔고 데이터 수집 실패", "details": balance_data, "success": False}
            
            # 3. 시장 데이터 수집 (옵션)
            self.logger.info("3. 시장 데이터 수집 중...")
            market_data = self._fetch_market_data()
            
            # 4. 결과 반환
            result = {
                "success": True,
                "balance_data": balance_data,
                "market_data": market_data,
                "retrieved_at": datetime.now().isoformat(),
                "environment": settings.TRADING_ENV
            }
            
            self.logger.info("계좌 데이터 취득 완료")
            return result
            
        except Exception as e:
            self.logger.error(f"계좌 데이터 취득 중 오류: {e}")
            return {"error": str(e), "success": False}
    
    def _authenticate(self) -> bool:
        """KIS API 인증"""
        try:
            # 환경에 따른 URL 설정
            if settings.TRADING_ENV == "real":
                kis_client.base_url = "https://openapi.koreainvestment.com:9443"
            else:
                kis_client.base_url = "https://openapivts.koreainvestment.com:29443"
            
            self.logger.info(f"API URL: {kis_client.base_url}")
            return kis_client.authenticate()
            
        except Exception as e:
            self.logger.error(f"인증 오류: {e}")
            return False
    
    def _fetch_balance_data(self) -> Optional[Dict]:
        """잔고 데이터 수집"""
        try:
            return kis_client.get_overseas_balance()
        except Exception as e:
            self.logger.error(f"잔고 데이터 수집 오류: {e}")
            return {"error": str(e)}
    
    def _fetch_market_data(self) -> Optional[Dict]:
        """시장 데이터 수집 (뉴스 등)"""
        try:
            news_data = kis_client.get_overseas_news(limit=10)
            
            market_data = {
                "news": [],
                "status": "active",
                "last_updated": datetime.now().isoformat()
            }
            
            # 뉴스 데이터가 있다면 처리
            if news_data and news_data.get("rt_cd") == "0":
                news_output = news_data.get("output", [])
                if news_output:
                    for news in news_output[:5]:  # 최신 5개만
                        market_data["news"].append({
                            "title": news.get("title", ""),
                            "time": news.get("time", ""),
                            "summary": news.get("summary", ""),
                            "link": news.get("link", "")
                        })
            
            return market_data
            
        except Exception as e:
            self.logger.warning(f"시장 데이터 수집 오류 (선택사항): {e}")
            return None
    
    def get_test_data(self) -> Dict:
        """테스트용 데이터 취득"""
        try:
            self.logger.info("테스트용 데이터 취득 시작")
            
            # 샘플 잔고 데이터 생성
            sample_balance = {
                "rt_cd": "0",
                "msg_cd": "APIF0001",
                "msg1": "성공",
                "output1": [
                    {
                        "ovrs_pdno": "AAPL",
                        "ovrs_item_name": "Apple Inc.",
                        "ovrs_cblc_qty": "100",
                        "now_pric2": "175.50",
                        "ovrs_stck_evlu_amt": "15000.00",
                        "pchs_avg_pric": "150.00"
                    },
                    {
                        "ovrs_pdno": "GOOGL",
                        "ovrs_item_name": "Alphabet Inc.",
                        "ovrs_cblc_qty": "50",
                        "now_pric2": "140.00",
                        "ovrs_stck_evlu_amt": "6500.00",
                        "pchs_avg_pric": "130.00"
                    },
                    {
                        "ovrs_pdno": "TSLA",
                        "ovrs_item_name": "Tesla Inc.",
                        "ovrs_cblc_qty": "25",
                        "now_pric2": "180.00",
                        "ovrs_stck_evlu_amt": "5000.00",
                        "pchs_avg_pric": "200.00"
                    }
                ],
                "output2": {
                    "tot_evlu_pfls_amt": "2550.00",
                    "ovrs_tot_pfls": "2550.00",
                    "tot_pftrt": "9.62"
                }
            }
            
            # 샘플 시장 데이터 생성
            sample_market = {
                "news": [
                    {
                        "title": "테스트 뉴스 1",
                        "time": "2024-01-01 09:00:00",
                        "summary": "테스트용 뉴스 요약",
                        "link": "https://example.com/news1"
                    }
                ],
                "status": "active",
                "last_updated": datetime.now().isoformat()
            }
            
            result = {
                "success": True,
                "balance_data": sample_balance,
                "market_data": sample_market,
                "retrieved_at": datetime.now().isoformat(),
                "environment": "test"
            }
            
            self.logger.info("테스트용 데이터 취득 완료")
            return result
            
        except Exception as e:
            self.logger.error(f"테스트용 데이터 취득 오류: {e}")
            return {"error": str(e), "success": False}


def main():
    """메인 실행 함수"""
    setup_logging('data_acquisition.log')
    logger = logging.getLogger(__name__)
    
    print("🚀 KIS 데이터 취득 시스템")
    print(f"환경: {settings.TRADING_ENV}")
    print(f"계좌: {settings.KIS_ACCOUNT_NUMBER}")
    print("-" * 50)
    
    data_service = DataAcquisitionService()
    
    try:
        # 실제 계좌 데이터 취득
        print("📊 계좌 데이터 취득 중...")
        result = data_service.get_account_data()
        
        if result["success"]:
            print("✅ 계좌 데이터 취득 성공!")
            balance_data = result['balance_data']
            market_data = result['market_data']
            
            # 잔고 데이터 정보 출력
            if balance_data and balance_data.get("rt_cd") == "0":
                holdings = balance_data.get("output1", [])
                print(f"📈 보유 종목: {len(holdings)}개")
                for holding in holdings:
                    symbol = holding.get('ovrs_pdno', 'N/A')
                    name = holding.get('ovrs_item_name', 'N/A')
                    quantity = holding.get('ovrs_cblc_qty', '0')
                    print(f"  - {symbol} ({name}): {quantity}주")
            
            # 시장 데이터 정보 출력
            if market_data and market_data.get('news'):
                print(f"📰 뉴스: {len(market_data['news'])}건")
        else:
            print(f"❌ 계좌 데이터 취득 실패: {result['error']}")
            
            # 테스트 데이터 취득 시도
            print("\n🧪 테스트 데이터 취득 시도...")
            test_result = data_service.get_test_data()
            
            if test_result["success"]:
                print("✅ 테스트 데이터 취득 성공!")
                balance_data = test_result['balance_data']
                holdings = balance_data.get("output1", [])
                print(f"📈 테스트 보유 종목: {len(holdings)}개")
            else:
                print(f"❌ 테스트 데이터 취득도 실패: {test_result['error']}")
        
    except KeyboardInterrupt:
        print("\n⏹️ 사용자에 의해 중단되었습니다.")
    except Exception as e:
        logger.error(f"메인 실행 오류: {e}")
        print(f"❌ 실행 오류: {e}")


if __name__ == "__main__":
    main()