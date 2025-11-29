from src.kis_api import kis_client
from src.analysis.metrics import (
    calculate_daily_returns, calculate_volatility, 
    calculate_beta, calculate_sharpe_ratio, calculate_max_drawdown
)
import pandas as pd
import logging

logger = logging.getLogger(__name__)

async def perform_portfolio_analysis(balance):
    """포트폴리오 분석 수행 (리스크 지표 및 벤치마크 비교)"""
    try:
        if not balance.positions:
            return None

        # 1. 벤치마크 (SPY) 데이터 조회
        # SPY는 NYSE Arca (AMS) 또는 NYSE (NYS)에 상장됨. KIS에서는 보통 AMS 또는 NYS.
        # 안전하게 AMS 시도 후 실패시 NYS, NASD 시도하는 로직이 좋으나 여기서는 AMS 우선 시도.
        spy_data = kis_client.get_overseas_daily_price("SPY", exchange="AMS")
        if not spy_data.get('output2'):
             spy_data = kis_client.get_overseas_daily_price("SPY", exchange="NYS")
             
        spy_prices = [float(item['clos']) for item in spy_data.get('output2', [])]
        spy_prices.reverse()
        spy_returns = calculate_daily_returns(spy_prices)

        # 2. 포트폴리오 일별 수익률 계산
        total_value = balance.stock_value
        weighted_returns_sum = None
        
        for pos in balance.positions:
            weight = pos.market_value / total_value if total_value > 0 else 0
            # 포지션에 저장된 거래소 코드 사용
            stock_data = kis_client.get_overseas_daily_price(pos.ticker, exchange=pos.exchange or "NASD")
            prices = [float(item['clos']) for item in stock_data.get('output2', [])]
            prices.reverse()
            returns = calculate_daily_returns(prices)
            
            min_len = min(len(returns), len(spy_returns))
            returns = returns.iloc[-min_len:].reset_index(drop=True)
            
            if weighted_returns_sum is None:
                weighted_returns_sum = returns * weight
            else:
                weighted_returns_sum = weighted_returns_sum.add(returns * weight, fill_value=0)
        
        portfolio_returns = weighted_returns_sum if weighted_returns_sum is not None else pd.Series([])
        
        # 3. 리스크 지표 계산
        min_len = min(len(portfolio_returns), len(spy_returns))
        portfolio_returns = portfolio_returns.iloc[-min_len:]
        benchmark_returns = spy_returns.iloc[-min_len:]
        
        volatility = calculate_volatility(portfolio_returns)
        beta = calculate_beta(portfolio_returns, benchmark_returns)
        sharpe = calculate_sharpe_ratio(portfolio_returns)
        mdd = calculate_max_drawdown((1 + portfolio_returns).cumprod().tolist())
        
        # 4. 차트 데이터 (누적 수익률)
        portfolio_cum_return = (1 + portfolio_returns).cumprod() - 1
        benchmark_cum_return = (1 + benchmark_returns).cumprod() - 1
        
        chart_data = []
        for i in range(min_len):
            chart_data.append({
                "date": f"Day {i}",
                "portfolio": float(portfolio_cum_return.iloc[i]),
                "benchmark": float(benchmark_cum_return.iloc[i])
            })
            
        return {
            "metrics": {
                "volatility": volatility,
                "beta": beta,
                "sharpe_ratio": sharpe,
                "max_drawdown": mdd
            },
            "chart_data": chart_data
        }
    except Exception as e:
        logger.error(f"Analysis service error: {e}")
        return None
