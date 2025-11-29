"""
시장 지수 비교 서비스
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import numpy as np

logger = logging.getLogger(__name__)


class MarketComparisonService:
    """시장 지수 대비 포트폴리오 성과 비교"""
    
    def __init__(self, db_connection=None):
        """
        Args:
            db_connection: PostgreSQL 연결 (향후 구현)
        """
        self.db = db_connection
    
    def calculate_alpha(
        self,
        portfolio_return: float,
        market_return: float,
        risk_free_rate: float = 0.05
    ) -> float:
        """
        Alpha 계산: 포트폴리오가 시장 대비 얼마나 초과 수익을 냈는지
        
        Args:
            portfolio_return: 포트폴리오 수익률 (%)
            market_return: 시장 수익률 (%)
            risk_free_rate: 무위험 수익률 (연간, 기본 5%)
        
        Returns:
            Alpha 값 (%)
        """
        return portfolio_return - market_return
    
    def calculate_beta(
        self,
        portfolio_returns: List[float],
        market_returns: List[float]
    ) -> float:
        """
        Beta 계산: 시장 대비 포트폴리오 변동성
        
        Beta = Cov(포트폴리오, 시장) / Var(시장)
        - Beta < 1: 시장보다 변동성 낮음 (방어적)
        - Beta = 1: 시장과 동일
        - Beta > 1: 시장보다 변동성 높음 (공격적)
        
        Args:
            portfolio_returns: 일별 포트폴리오 수익률 리스트
            market_returns: 일별 시장 수익률 리스트
        
        Returns:
            Beta 값
        """
        if len(portfolio_returns) != len(market_returns):
            raise ValueError("Portfolio and market returns must have same length")
        
        if len(portfolio_returns) < 2:
            return 1.0
        
        # NumPy로 공분산 및 분산 계산
        covariance = np.cov(portfolio_returns, market_returns)[0][1]
        market_variance = np.var(market_returns)
        
        if market_variance == 0:
            return 1.0
        
        beta = covariance / market_variance
        return beta
    
    def calculate_sharpe_ratio(
        self,
        returns: List[float],
        risk_free_rate: float = 0.05
    ) -> float:
        """
        Sharpe Ratio 계산: 위험 대비 수익률
        
        Sharpe Ratio = (평균 수익률 - 무위험 수익률) / 표준편차
        - 높을수록 좋음 (위험 대비 수익이 큼)
        
        Args:
            returns: 일별 수익률 리스트
            risk_free_rate: 무위험 수익률 (연간)
        
        Returns:
            Sharpe Ratio
        """
        if len(returns) < 2:
            return 0.0
        
        avg_return = np.mean(returns)
        std_dev = np.std(returns)
        
        if std_dev == 0:
            return 0.0
        
        # 일별 무위험 수익률
        daily_rf_rate = risk_free_rate / 252  # 연간 252 거래일
        
        sharpe = (avg_return - daily_rf_rate) / std_dev
        return sharpe
    
    def compare_with_market(
        self,
        portfolio_data: Dict,
        market_data: Dict,
        period: str = "1M"
    ) -> Dict:
        """
        포트폴리오와 시장 지수 비교
        
        Args:
            portfolio_data: {
                'start_value': float,
                'end_value': float,
                'daily_data': [{'date': str, 'value': float, 'return': float}]
            }
            market_data: {
                'SPX': {'start_value': float, 'end_value': float, 'daily_data': [...]},
                'NAS': {...}
            }
            period: "1M", "3M", "1Y"
        
        Returns:
            비교 결과 딕셔너리
        """
        try:
            # 포트폴리오 수익률 계산
            portfolio_total_return = (
                (portfolio_data['end_value'] - portfolio_data['start_value'])
                / portfolio_data['start_value'] * 100
            )
            
            # 일별 수익률 추출
            portfolio_daily_returns = [
                item['return'] for item in portfolio_data['daily_data']
            ]
            
            # 각 지수와 비교
            comparisons = {}
            for index_code, index_data in market_data.items():
                index_total_return = (
                    (index_data['end_value'] - index_data['start_value'])
                    / index_data['start_value'] * 100
                )
                
                index_daily_returns = [
                    item['return'] for item in index_data['daily_data']
                ]
                
                # 지표 계산
                alpha = self.calculate_alpha(portfolio_total_return, index_total_return)
                
                try:
                    beta = self.calculate_beta(portfolio_daily_returns, index_daily_returns)
                except Exception as e:
                    logger.warning(f"Beta calculation failed for {index_code}: {e}")
                    beta = 1.0
                
                # 시장 대비 우수한 날 계산
                outperformance_days = sum(
                    1 for p, m in zip(portfolio_daily_returns, index_daily_returns)
                    if p > m
                )
                
                comparisons[index_code] = {
                    'index_return': index_total_return,
                    'alpha': alpha,
                    'beta': beta,
                    'outperformance_days': outperformance_days
                }
            
            # Sharpe Ratio 계산
            sharpe_ratio = self.calculate_sharpe_ratio(portfolio_daily_returns)
            
            return {
                'success': True,
                'portfolio_return': portfolio_total_return,
                'comparisons': comparisons,
                'sharpe_ratio': sharpe_ratio,
                'total_days': len(portfolio_daily_returns)
            }
        
        except Exception as e:
            logger.error(f"Error in market comparison: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_market_index_data(
        self,
        index_code: str,
        start_date: str,
        end_date: str
    ) -> Optional[Dict]:
        """
        DB에서 시장 지수 데이터 조회 (향후 구현)
        
        Args:
            index_code: 'SPX', 'NAS', 'DOW'
            start_date: 'YYYY-MM-DD'
            end_date: 'YYYY-MM-DD'
        
        Returns:
            {
                'start_value': float,
                'end_value': float,
                'daily_data': [{'date': str, 'value': float, 'return': float}]
            }
        """
        # TODO: PostgreSQL market_indices 테이블에서 조회
        logger.warning("get_market_index_data not yet implemented")
        return None
    
    def save_market_index_data(
        self,
        index_code: str,
        date: str,
        close_price: float,
        daily_return: Optional[float] = None
    ) -> bool:
        """
        시장 지수 데이터 저장 (향후 구현)
        
        Args:
            index_code: 'SPX', 'NAS', 'DOW'
            date: 'YYYY-MM-DD'
            close_price: 종가
            daily_return: 일일 수익률 (%)
        
        Returns:
            성공 여부
        """
        # TODO: PostgreSQL market_indices 테이블에 저장
        logger.warning("save_market_index_data not yet implemented")
        return False
