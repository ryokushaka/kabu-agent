"""
데이터베이스 모델 정의
"""
from sqlalchemy import Column, String, Integer, DateTime, Date, Text, Boolean, ForeignKey, Index
from sqlalchemy.types import Numeric as Decimal
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from passlib.hash import bcrypt
import uuid

Base = declarative_base()


class User(Base):
    """사용자 테이블"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # 관계 설정
    portfolios = relationship("Portfolio", back_populates="user", cascade="all, delete-orphan")
    api_tokens = relationship("UserApiToken", back_populates="user", cascade="all, delete-orphan")
    
    def verify_password(self, password: str) -> bool:
        """비밀번호 검증"""
        return bcrypt.verify(password, self.hashed_password)
    
    @classmethod
    def hash_password(cls, password: str) -> str:
        """비밀번호 해시"""
        return bcrypt.hash(password)


class Portfolio(Base):
    """포트폴리오 테이블"""
    __tablename__ = "portfolios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    account_number = Column(String(20), nullable=False)
    total_assets = Column(Decimal(15, 2), default=0)
    total_invested = Column(Decimal(15, 2), default=0)
    total_profit_loss = Column(Decimal(15, 2), default=0)
    cash_balance = Column(Decimal(15, 2), default=0)
    currency = Column(String(3), default='USD')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="portfolios")
    positions = relationship("Position", back_populates="portfolio", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="portfolio", cascade="all, delete-orphan")
    history = relationship("PortfolioHistory", back_populates="portfolio", cascade="all, delete-orphan")


class Position(Base):
    """포지션 테이블"""
    __tablename__ = "positions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String(20), nullable=False)
    name = Column(String(200))
    quantity = Column(Integer, nullable=False)
    avg_price = Column(Decimal(10, 4), nullable=False)
    current_price = Column(Decimal(10, 4))
    market_value = Column(Decimal(15, 2))
    profit_loss = Column(Decimal(15, 2))
    profit_loss_percent = Column(Decimal(8, 4))
    sector = Column(String(50))
    exchange = Column(String(10), default='NASD')
    currency = Column(String(3), default='USD')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    portfolio = relationship("Portfolio", back_populates="positions")


class Transaction(Base):
    """거래 내역 테이블"""
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False)
    ticker = Column(String(20), nullable=False)
    transaction_type = Column(String(10), nullable=False)  # 'BUY', 'SELL'
    quantity = Column(Integer, nullable=False)
    price = Column(Decimal(10, 4), nullable=False)
    total_amount = Column(Decimal(15, 2), nullable=False)
    fees = Column(Decimal(10, 2), default=0)
    transaction_date = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    portfolio = relationship("Portfolio", back_populates="transactions")


class PortfolioHistory(Base):
    """포트폴리오 히스토리 테이블"""
    __tablename__ = "portfolio_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False)
    date = Column(Date, nullable=False)
    total_assets = Column(Decimal(15, 2), nullable=False)
    total_invested = Column(Decimal(15, 2), nullable=False)
    cash_balance = Column(Decimal(15, 2), nullable=False)
    daily_return = Column(Decimal(8, 4))
    total_return = Column(Decimal(8, 4))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    portfolio = relationship("Portfolio", back_populates="history")


class UserApiToken(Base):
    """유저별 API 토큰 관리 테이블"""
    __tablename__ = "user_api_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    service = Column(String(20), nullable=False, default='KIS')
    access_token = Column(Text, nullable=False)
    token_type = Column(String(20), default='Bearer')
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # KIS API 관련 설정
    kis_app_key = Column(String(100))
    kis_app_secret = Column(String(100))
    kis_account_number = Column(String(20))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="api_tokens")
    
    # 인덱스 설정
    __table_args__ = (
        Index('idx_user_service', 'user_id', 'service'),
    )


class ExchangeRate(Base):
    """환율 캐시 테이블"""
    __tablename__ = "exchange_rates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    base_currency = Column(String(3), nullable=False)
    target_currency = Column(String(3), nullable=False)
    rate = Column(Decimal(12, 6), nullable=False)
    source = Column(String(50), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())