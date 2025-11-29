from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class Holding(BaseModel):
    symbol: str
    name: str
    quantity: float
    current_price: float
    average_price: float
    total_value: float
    return_rate: float
    sector: Optional[str] = "Unknown"
    fifty_two_week_high: Optional[float] = 0.0
    fifty_two_week_low: Optional[float] = 0.0
    weight: Optional[float] = 0.0
    currency: str = "USD"

class PortfolioSummary(BaseModel):
    total_value_usd: float
    total_value_krw: float
    total_profit_loss: float
    total_return_rate: float
    cash_balance: float = 0.0
    holdings: List[Holding]
    sector_allocation: Optional[dict] = {}
    analysis: Optional[dict] = None # Risk metrics and chart data
    daily_return: Optional[float] = 0.0
    max_drawdown: Optional[float] = 0.0
    exchange_rate: Optional[float] = 1350.0 # Default fallback

class MarketNews(BaseModel):
    title: str
    time: str
    summary: str
    link: str
