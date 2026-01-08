-- 004: 시장 뉴스 및 투자 용어 가이드 테이블
-- Created: 2026-01-08
-- Description: 배치 작업 기반 뉴스 피드 및 투자 용어 가이드 시스템

-- 1. market_news 테이블
CREATE TABLE IF NOT EXISTS market_news (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content_url TEXT NOT NULL,
    ticker_symbols TEXT[] DEFAULT '{}',
    category VARCHAR(50),
    sentiment VARCHAR(20),
    is_featured BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 전문 검색
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || COALESCE(summary, ''))
    ) STORED,

    -- 중복 방지
    UNIQUE(content_url)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_news_published ON market_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_featured ON market_news(is_featured, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_tickers ON market_news USING GIN(ticker_symbols);
CREATE INDEX IF NOT EXISTS idx_news_search ON market_news USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_news_category ON market_news(category, published_at DESC);

-- 2. glossary_terms 테이블
CREATE TABLE IF NOT EXISTS glossary_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term_ko VARCHAR(200) NOT NULL,
    term_en VARCHAR(200) NOT NULL,
    definition TEXT NOT NULL,
    example TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    related_terms UUID[] DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 전문 검색
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple', term_ko || ' ' || definition || ' ' || term_en)
    ) STORED,

    -- 중복 방지
    UNIQUE(term_ko, term_en)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_glossary_category ON glossary_terms(category);
CREATE INDEX IF NOT EXISTS idx_glossary_difficulty ON glossary_terms(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_glossary_search ON glossary_terms USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_glossary_popular ON glossary_terms(view_count DESC);

-- 3. batch_job_logs 테이블
CREATE TABLE IF NOT EXISTS batch_job_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    items_processed INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_job_logs_job_id ON batch_job_logs(job_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_logs_status ON batch_job_logs(status, started_at DESC);

-- 4. 기본 투자 용어 데이터 삽입 (50개)
INSERT INTO glossary_terms (term_ko, term_en, definition, example, category, difficulty_level) VALUES
-- 리스크 관련 (10개)
('변동성', 'Volatility', '자산 가격의 변동 폭을 나타내는 지표로, 높을수록 리스크가 크다.', '연간 변동성 20%는 주가가 평균적으로 ±20% 범위에서 움직일 수 있음을 의미합니다.', 'risk', 'beginner'),
('베타', 'Beta', '시장 전체(S&P 500) 대비 개별 포트폴리오의 민감도. 1보다 크면 시장보다 변동성이 크고, 작으면 안정적.', '베타가 1.2인 주식은 시장이 10% 오르면 평균적으로 12% 오릅니다.', 'risk', 'intermediate'),
('최대 낙폭', 'Max Drawdown', '특정 기간 동안 포트폴리오가 고점에서 저점까지 떨어진 최대 하락률.', '최대 낙폭 -30%는 최고점 대비 30% 하락한 시점이 있었다는 의미입니다.', 'risk', 'intermediate'),
('샤프 지수', 'Sharpe Ratio', '위험 1단위당 초과 수익률을 나타내며, 높을수록 효율적인 투자.', '샤프 지수 1.5는 위험 대비 양호한 수익률을 의미합니다.', 'risk', 'advanced'),
('표준편차', 'Standard Deviation', '수익률의 분산 정도를 나타내며, 높을수록 변동성이 큼.', '월 표준편차 5%는 대부분의 월이 평균±5% 범위에서 움직임을 의미합니다.', 'risk', 'intermediate'),
('VaR', 'Value at Risk', '특정 신뢰수준 하에서 발생 가능한 최대 손실액.', '95% 신뢰수준 VaR -10만원은 95%의 경우 손실이 10만원을 넘지 않음을 의미합니다.', 'risk', 'advanced'),
('알파', 'Alpha', '시장 대비 초과 수익률. 양수면 시장보다 우수한 성과.', '알파 5%는 시장보다 5%p 높은 수익률을 달성했다는 의미입니다.', 'risk', 'intermediate'),
('하방 리스크', 'Downside Risk', '손실 가능성에 초점을 맞춘 리스크 지표.', '하방 변동성은 음의 수익률만 고려하여 계산됩니다.', 'risk', 'advanced'),
('상관계수', 'Correlation', '두 자산 간 움직임의 관계. -1~1 사이 값으로 0에 가까울수록 독립적.', '상관계수 0.8은 두 자산이 비슷하게 움직이는 경향이 강함을 의미합니다.', 'risk', 'intermediate'),
('집중도 리스크', 'Concentration Risk', '특정 종목이나 섹터에 과도하게 집중된 리스크.', '한 종목이 포트폴리오의 50% 이상을 차지하면 집중도 리스크가 높습니다.', 'risk', 'beginner'),

-- 수익률 관련 (10개)
('수익률', 'Return Rate', '투자 원금 대비 수익의 비율. (현재가치 - 투자금액) / 투자금액 × 100', '100만원 투자하여 120만원이 되었다면 수익률은 20%입니다.', 'returns', 'beginner'),
('연환산 수익률', 'Annualized Return', '특정 기간의 수익률을 1년 단위로 환산한 값.', '6개월 수익률 10%를 연환산하면 약 21%입니다.', 'returns', 'intermediate'),
('평가 손익', 'Unrealized P&L', '아직 매도하지 않은 보유 자산의 현재 손익.', '평균 매수가 100달러, 현재가 120달러면 평가 이익은 +20%입니다.', 'returns', 'beginner'),
('실현 손익', 'Realized P&L', '실제 매도하여 확정된 손익.', '매수가 100달러, 매도가 120달러면 실현 이익은 +20달러입니다.', 'returns', 'beginner'),
('복리 수익률', 'Compound Return', '수익을 재투자하여 얻는 누적 수익률.', '연 10% 복리로 3년 투자하면 총 33.1% 수익입니다.', 'returns', 'intermediate'),
('절대 수익률', 'Absolute Return', '벤치마크와 무관하게 측정한 실제 수익률.', '시장이 -10%여도 +5%를 달성했다면 절대 수익률은 +5%입니다.', 'returns', 'beginner'),
('상대 수익률', 'Relative Return', '벤치마크 대비 초과 또는 미달 수익률.', '시장 +10%, 포트폴리오 +15%면 상대 수익률은 +5%p입니다.', 'returns', 'intermediate'),
('배당 수익률', 'Dividend Yield', '주가 대비 연간 배당금 비율.', '주가 100달러, 연간 배당 4달러면 배당 수익률은 4%입니다.', 'returns', 'beginner'),
('토탈 리턴', 'Total Return', '가격 상승 + 배당 수익을 합한 총 수익률.', '주가 10% 상승 + 배당 2% = 토탈 리턴 12%입니다.', 'returns', 'intermediate'),
('IRR', 'Internal Rate of Return', '현금 흐름을 고려한 내부 수익률.', '분할 매수/매도 시 정확한 수익률 계산에 사용됩니다.', 'returns', 'advanced'),

-- 섹터 관련 (10개)
('섹터', 'Sector', '산업 분류 단위로 경제 활동을 11개 주요 영역으로 구분.', 'Apple은 기술(Technology) 섹터, JP Morgan은 금융(Financials) 섹터입니다.', 'sector', 'beginner'),
('기술주', 'Technology Stocks', 'IT, 소프트웨어, 하드웨어 등 기술 기업 주식.', 'Apple, Microsoft, Google 등이 대표적인 기술주입니다.', 'sector', 'beginner'),
('금융주', 'Financials', '은행, 보험, 증권 등 금융 서비스 기업 주식.', 'JP Morgan, Bank of America 등이 금융 섹터입니다.', 'sector', 'beginner'),
('헬스케어', 'Healthcare', '제약, 의료기기, 병원 등 건강 관련 기업.', 'Johnson & Johnson, Pfizer 등이 헬스케어 섹터입니다.', 'sector', 'beginner'),
('필수소비재', 'Consumer Staples', '식품, 음료, 생활용품 등 필수 소비재 기업.', 'Coca-Cola, Procter & Gamble 등이 필수소비재입니다.', 'sector', 'beginner'),
('임의소비재', 'Consumer Discretionary', '자동차, 의류, 레저 등 선택적 소비재 기업.', 'Amazon, Tesla, Nike 등이 임의소비재입니다.', 'sector', 'beginner'),
('에너지', 'Energy', '석유, 가스, 신재생 에너지 기업.', 'Exxon Mobil, Chevron 등이 에너지 섹터입니다.', 'sector', 'beginner'),
('산업재', 'Industrials', '항공, 운송, 건설, 국방 등 산업재 기업.', 'Boeing, Caterpillar 등이 산업재 섹터입니다.', 'sector', 'beginner'),
('통신서비스', 'Communication Services', '통신, 미디어, 엔터테인먼트 기업.', 'Verizon, Disney, Meta 등이 통신서비스입니다.', 'sector', 'beginner'),
('섹터 로테이션', 'Sector Rotation', '경기 순환에 따라 유망 섹터가 바뀌는 현상.', '경기 확장기에는 기술/임의소비재, 침체기에는 필수소비재/헬스케어가 유망합니다.', 'sector', 'intermediate'),

-- 시장 지표 (10개)
('S&P 500', 'S&P 500', '미국 대형주 500개 기업의 시가총액 가중 평균 지수.', 'S&P 500은 미국 주식 시장의 대표 지수로 사용됩니다.', 'market', 'beginner'),
('NASDAQ', 'NASDAQ', '기술주 중심의 나스닥 거래소 주요 지수.', 'NASDAQ 100은 기술주 성과를 추적하는 주요 지수입니다.', 'market', 'beginner'),
('다우존스', 'Dow Jones', '미국 대형 우량주 30개 기업의 가격 가중 평균 지수.', '다우존스는 가장 오래된 미국 주가 지수입니다.', 'market', 'beginner'),
('PER', 'Price-to-Earnings Ratio', '주가를 주당순이익(EPS)으로 나눈 값. 주가가 수익의 몇 배인지 나타냄.', 'PER 20은 현재 수익 기준으로 투자금 회수에 20년이 걸린다는 의미입니다.', 'market', 'intermediate'),
('PBR', 'Price-to-Book Ratio', '주가를 주당순자산(BPS)으로 나눈 값. 1보다 작으면 저평가.', 'PBR 0.8은 자산 가치보다 주가가 20% 낮다는 의미입니다.', 'market', 'intermediate'),
('시가총액', 'Market Cap', '발행 주식 수 × 주가. 기업의 시장 가치.', '주가 100달러, 발행주식 1억주면 시가총액은 100억 달러입니다.', 'market', 'beginner'),
('ROE', 'Return on Equity', '자기자본 대비 순이익 비율. 기업의 수익성 지표.', 'ROE 15%는 자기자본 100억원으로 15억원의 순이익을 냈다는 의미입니다.', 'market', 'intermediate'),
('EPS', 'Earnings Per Share', '주당순이익. 순이익을 발행 주식 수로 나눈 값.', 'EPS 5달러는 주식 1주당 5달러의 이익을 냈다는 의미입니다.', 'market', 'beginner'),
('배당성향', 'Payout Ratio', '순이익 중 배당으로 지급하는 비율.', '배당성향 40%는 순이익의 40%를 주주에게 배당한다는 의미입니다.', 'market', 'intermediate'),
('RSI', 'Relative Strength Index', '과매수/과매도 판단 지표. 70 이상은 과매수, 30 이하는 과매도.', 'RSI 80은 과열 신호로 단기 조정 가능성을 시사합니다.', 'market', 'advanced'),

-- 거래/투자 용어 (10개)
('ETF', 'Exchange-Traded Fund', '특정 지수나 자산을 추종하는 상장지수펀드.', 'SPY는 S&P 500을 추종하는 대표적인 ETF입니다.', 'investment', 'beginner'),
('리밸런싱', 'Rebalancing', '목표 자산 배분 비율을 유지하기 위해 포트폴리오를 재조정.', '주식 60%, 채권 40% 목표 시 주식이 70%로 늘면 일부 매도합니다.', 'investment', 'intermediate'),
('달러 코스트 애버리징', 'Dollar Cost Averaging', '일정 금액을 정기적으로 투자하여 평균 매수 단가를 낮추는 전략.', '매달 100만원씩 투자하면 가격 변동 리스크를 분산할 수 있습니다.', 'investment', 'beginner'),
('분산 투자', 'Diversification', '여러 자산/섹터에 투자하여 리스크를 줄이는 전략.', '한 종목에 집중하지 않고 10개 이상 종목에 분산 투자합니다.', 'investment', 'beginner'),
('손절', 'Stop Loss', '손실을 제한하기 위해 미리 정한 가격에 매도.', '매수가 대비 -10% 하락 시 무조건 매도하는 규칙을 정합니다.', 'investment', 'beginner'),
('익절', 'Take Profit', '목표 수익률 달성 시 이익을 실현하는 매도.', '+20% 수익 시 절반을 매도하여 이익을 확보합니다.', 'investment', 'beginner'),
('레버리지', 'Leverage', '차입을 통해 투자 규모를 늘리는 전략. 수익과 손실 모두 확대.', '레버리지 2배 ETF는 지수가 10% 오르면 20% 오릅니다.', 'investment', 'advanced'),
('공매도', 'Short Selling', '주식을 빌려 매도 후 가격 하락 시 되사서 차익을 얻는 전략.', '100달러에 공매도 → 80달러에 환매 = 20달러 이익', 'investment', 'advanced'),
('옵션', 'Options', '미래 특정 가격에 사고팔 권리를 거래하는 파생상품.', '콜옵션은 미래에 살 권리, 풋옵션은 팔 권리입니다.', 'investment', 'advanced'),
('헤지', 'Hedge', '리스크를 줄이기 위한 반대 포지션 보유.', '주식 보유 시 풋옵션 매수로 하락 리스크를 헤지합니다.', 'investment', 'advanced')
ON CONFLICT (term_ko, term_en) DO NOTHING;

-- 5. 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_market_news_updated_at BEFORE UPDATE ON market_news
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_terms_updated_at BEFORE UPDATE ON glossary_terms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 마이그레이션 완료 확인
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 004 completed successfully';
    RAISE NOTICE '   - Created market_news table with %s indexes', (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'market_news');
    RAISE NOTICE '   - Created glossary_terms table with %s indexes', (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'glossary_terms');
    RAISE NOTICE '   - Created batch_job_logs table with %s indexes', (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'batch_job_logs');
    RAISE NOTICE '   - Inserted %s glossary terms', (SELECT COUNT(*) FROM glossary_terms);
END $$;
