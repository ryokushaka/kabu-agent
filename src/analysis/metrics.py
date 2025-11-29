import pandas as pd
import numpy as np
from typing import List, Dict, Union

def calculate_daily_returns(prices: List[float]) -> pd.Series:
    """일별 수익률 계산"""
    if not prices:
        return pd.Series(dtype=float)
    return pd.Series(prices).pct_change().dropna()

def calculate_volatility(returns: pd.Series, annualize: bool = True) -> float:
    """변동성 (표준편차) 계산"""
    if returns.empty:
        return 0.0
    vol = returns.std()
    if annualize:
        vol *= np.sqrt(252) # 연간화 (거래일 252일 기준)
    return float(vol)

def calculate_beta(asset_returns: pd.Series, benchmark_returns: pd.Series) -> float:
    """베타 (시장 민감도) 계산"""
    if asset_returns.empty or benchmark_returns.empty:
        return 0.0
    
    # 데이터 길이 맞추기 (날짜 인덱스가 없으므로 길이만 맞춤, 실제로는 날짜 매칭 필요)
    min_len = min(len(asset_returns), len(benchmark_returns))
    asset_returns = asset_returns.iloc[-min_len:]
    benchmark_returns = benchmark_returns.iloc[-min_len:]
    
    covariance = np.cov(asset_returns, benchmark_returns)[0][1]
    variance = np.var(benchmark_returns)
    
    if variance == 0:
        return 0.0
    
    return float(covariance / variance)

def calculate_sharpe_ratio(returns: pd.Series, risk_free_rate: float = 0.02) -> float:
    """샤프 지수 계산 (Risk Free Rate 기본 2%)"""
    if returns.empty:
        return 0.0
    
    excess_returns = returns - (risk_free_rate / 252)
    mean_excess_return = excess_returns.mean()
    std_dev = returns.std()
    
    if std_dev == 0:
        return 0.0
        
    sharpe = mean_excess_return / std_dev
    return float(sharpe * np.sqrt(252)) # 연간화

def calculate_max_drawdown(prices: List[float]) -> float:
    """최대 낙폭 (MDD) 계산"""
    if not prices:
        return 0.0
        
    price_series = pd.Series(prices)
    rolling_max = price_series.cummax()
    drawdown = (price_series - rolling_max) / rolling_max
    max_drawdown = drawdown.min()
    
    return float(max_drawdown)
