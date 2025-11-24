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

class PortfolioSummary(BaseModel):
    total_value_usd: float
    total_value_krw: float
    total_profit_loss: float
    total_return_rate: float
    holdings: List[Holding]

class MarketNews(BaseModel):
    title: str
    time: str
    summary: str
    link: str
