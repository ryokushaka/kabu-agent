-- Migration: AI Features (AI Feedback & Market Comparison)
-- Created: 2025-11-24

-- AI Feedbacks Table
CREATE TABLE IF NOT EXISTS ai_feedbacks (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    feedback_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Portfolio snapshot at time of feedback
    total_assets_usd DECIMAL(15, 2),
    total_return_percent DECIMAL(5, 2),
    daily_return_percent DECIMAL(5, 2),
    sector_distribution JSONB,
    top_holdings JSONB,
    
    -- AI response
    ai_response JSONB NOT NULL,
    
    -- Metadata
    model_version VARCHAR(50) DEFAULT 'gemini-1.5-pro',
    tokens_used INT,
    generation_time_ms INT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Market Indices Table
CREATE TABLE IF NOT EXISTS market_indices (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    index_code VARCHAR(10) NOT NULL,  -- 'SPX', 'NAS', 'DOW'
    close_price DECIMAL(10, 2) NOT NULL,
    daily_return DECIMAL(5, 2),
    volume BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date, index_code)
);

-- Daily Portfolio Snapshot Table (for MDD calculation & market comparison)
CREATE TABLE IF NOT EXISTS daily_portfolio_snapshot (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    date DATE NOT NULL,
    total_assets_usd DECIMAL(15, 2) NOT NULL,
    stock_value_usd DECIMAL(15, 2),
    cash_usd DECIMAL(15, 2),
    daily_return DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX idx_ai_feedbacks_user_id ON ai_feedbacks(user_id);
CREATE INDEX idx_ai_feedbacks_created_at ON ai_feedbacks(created_at DESC);
CREATE INDEX idx_market_indices_date ON market_indices(date DESC);
CREATE INDEX idx_market_indices_code ON market_indices(index_code);
CREATE INDEX idx_daily_snapshot_user_date ON daily_portfolio_snapshot(user_id, date DESC);

-- Comments
COMMENT ON TABLE ai_feedbacks IS 'AI generated portfolio feedback history';
COMMENT ON TABLE market_indices IS 'Daily market index data (S&P 500, NASDAQ, etc.)';
COMMENT ON TABLE daily_portfolio_snapshot IS 'Daily portfolio value snapshots for historical analysis';
