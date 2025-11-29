# 프리미엄 엑셀 리포트 업그레이드 제안서

## 목표
전문적인 위험 분석, 벤치마크 비교, 그리고 임원 보고용 서식을 추가하여 포트폴리오 리포트를 **"상용 서비스 수준"**으로 격상시킵니다.

## 제안 기능

### 1. 경영진 요약(Executive Summary) 및 표지
- **표지 (Cover Page)**: 고객명, 리포트 날짜, 총 운용 자산(AUM)이 포함된 전문적인 타이틀 페이지.
- **경영진 대시보드**: 핵심 성과 지표(KPI) 요약:
    - 벤치마크(S&P 500) 대비 총 수익률.
    - 포트폴리오 베타(Beta) 및 변동성(Volatility).
    - 샤프 지수(Sharpe Ratio).
    - 가중 배당 수익률(Dividend Yield).

### 2. 고급 위험 및 성과 분석 (Advanced Risk & Performance Analysis)
단순 손익을 넘어선 전문적인 리스크 지표를 제공합니다.
- **변동성 (Volatility)**: 포트폴리오의 위험도 측정 (표준편차).
- **베타 (Beta)**: 시장(S&P 500)과의 상관관계 및 민감도.
- **샤프 지수 (Sharpe Ratio)**: 위험 대비 수익률 효율성.
- **최대 낙폭 (Max Drawdown)**: 고점 대비 최대 하락폭.
*필수사항*: `get_overseas_daily_price`를 구현하여 보유 종목 및 벤치마크의 과거 주가 데이터를 수집해야 함.

### 3. 벤치마크 비교 (Benchmark Comparison)
- **성과 차트**: 지난 1년간 포트폴리오 vs S&P 500 (SPY) 누적 수익률 비교 라인 차트.
- **상관관계 매트릭스**: 상위 보유 종목 간의 상관관계 히트맵.

### 4. 배당 및 소득 분석 (Dividend & Income Analysis)
- **예상 연간 소득**: 배당 수익률 기반 연간 예상 수입.
- **투자 원금 대비 수익률 (Yield on Cost)**: 평균 매수가 기준 배당 수익률.

### 5. 전문적인 스타일링 (Professional Styling)
- **색상 팔레트**: 신뢰감을 주는 "금융 기관" 스타일 팔레트 (예: 네이비/골드/그레이).
- **레이아웃**: 인쇄에 최적화된 페이지 나누기 및 레이아웃 적용.

## 구현 계획

### 1단계: 데이터 확보 (Data Acquisition)
- `KISApiClient`에 `get_overseas_daily_price(symbol, period)` 구현.
- 모든 보유 종목 및 SPY(벤치마크)의 과거 데이터 수집.

### 2단계: 금융 계산 엔진 (Financial Calculation Engine)
- `src/analysis/metrics.py` 생성:
    - 일별 수익률 계산.
    - 변동성, 베타, 샤프 지수 계산 로직.
    - 포트폴리오 누적 수익률 시리즈 계산.

### 3단계: 엑셀 생성 업그레이드 (Excel Generation Upgrade)
- **신규 시트**:
    - `Cover`: 표지.
    - `Executive Summary`: KPI 및 벤치마크 차트.
    - `Risk Analysis`: 변동성/베타 상세 테이블.
- **차트 업그레이드**: 성과 비교를 위한 라인 차트 적용.

## KIS API 요구사항
- **일별 주가 API**: `HHDFS76003600` (해외주식 기간별 시세)를 사용하여 과거 데이터 확보 필요.
