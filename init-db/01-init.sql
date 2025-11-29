-- Kabu Agent 데이터베이스 초기화 스크립트

-- Extensions 설정
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(100) NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    total_assets DECIMAL(15,2) DEFAULT 0,
    total_invested DECIMAL(15,2) DEFAULT 0,
    total_profit_loss DECIMAL(15,2) DEFAULT 0,
    cash_balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, account_number)
);

-- 포지션 테이블
CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    ticker VARCHAR(20) NOT NULL,
    name VARCHAR(200),
    quantity INTEGER NOT NULL,
    avg_price DECIMAL(10,4) NOT NULL,
    current_price DECIMAL(10,4),
    market_value DECIMAL(15,2),
    profit_loss DECIMAL(15,2),
    profit_loss_percent DECIMAL(8,4),
    sector VARCHAR(50),
    exchange VARCHAR(10) DEFAULT 'NASD',
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(portfolio_id, ticker)
);

-- 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    ticker VARCHAR(20) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL, -- 'BUY', 'SELL'
    quantity INTEGER NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포트폴리오 히스토리 테이블
CREATE TABLE IF NOT EXISTS portfolio_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_assets DECIMAL(15,2) NOT NULL,
    total_invested DECIMAL(15,2) NOT NULL,
    cash_balance DECIMAL(15,2) NOT NULL,
    daily_return DECIMAL(8,4),
    total_return DECIMAL(8,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(portfolio_id, date)
);

-- KIS API 토큰 캐시 테이블
CREATE TABLE IF NOT EXISTS api_tokens (
    id SERIAL PRIMARY KEY,
    service VARCHAR(20) NOT NULL DEFAULT 'KIS',
    access_token TEXT NOT NULL,
    token_type VARCHAR(20) DEFAULT 'Bearer',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 환율 캐시 테이블
CREATE TABLE IF NOT EXISTS exchange_rates (
    id SERIAL PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    target_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(12,6) NOT NULL,
    source VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(base_currency, target_currency)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_portfolio_id ON positions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_positions_ticker ON positions(ticker);
CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_portfolio_date ON portfolio_history(portfolio_id, date);
CREATE INDEX IF NOT EXISTS idx_api_tokens_service ON api_tokens(service);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_currencies ON exchange_rates(base_currency, target_currency);

-- 업데이트 시간 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_api_tokens_updated_at BEFORE UPDATE ON api_tokens 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();