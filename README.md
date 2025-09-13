# Excel Portfolio Reporter

## 📊 프로젝트 개요

**Excel Portfolio Reporter**는 포트폴리오 분석 및 보고서 자동 생성을 위한 Python 기반 도구입니다.
엑셀 템플릿을 기반으로 포트폴리오 데이터를 시각화하고, AI를 활용한 투자 피드백을 제공합니다.

### 🎯 주요 기능

- **포트폴리오 대시보드**: 핵심 KPI 및 자산 구성 시각화
- **상세 포트폴리오 분석**: 종목별 상세 정보 및 성과 분석
- **시계열 추이 분석**: 자산 변화 추이 및 수익률 분석
- **AI 투자 피드백**: AI 기반 투자 권고사항 및 시장 분석
- **자동화된 보고서 생성**: 템플릿 기반 엑셀 보고서 자동 생성

## 📋 시트별 데이터 요구사항

### 1. 요약 대시보드 시트

<img width="1241" height="400" alt="요약 시트" src="https://github.com/user-attachments/assets/85528fd4-fd96-4f7e-b747-0f4643f179ea" />

#### 📈 핵심 지표 (KPI)

```python
portfolio_kpis = {
    "total_assets": 150000000,      # 총 자산 (원)
    "daily_return": 2.5,            # 일일 수익률 (%)
    "monthly_return": 8.3,          # 월간 수익률 (%)
    "annual_return": 25.7,          # 연간 수익률 (%)
    "max_drawdown": -12.4,          # 최대 낙폭 (MDD %)
    "cumulative_return": 45.2       # 누적 수익률 (%)
}
```

#### 🍩 자산 구성 데이터

```python
asset_composition = {
    "korean_stocks": 45.0,          # 한국 주식 (%)
    "us_stocks": 35.0,              # 미국 주식 (%)
    "cash": 20.0                    # 현금 (%)
}
```

#### 🌳 섹터별 분포 데이터

```python
sector_distribution = {
    "IT": 30.0,                     # IT 섹터 (%)
    "Finance": 25.0,                # 금융 섹터 (%)
    "Healthcare": 20.0,             # 헬스케어 섹터 (%)
    "Industrial": 15.0,             # 산업재 섹터 (%)
    "Consumer": 10.0                # 소비재 섹터 (%)
}
```

#### 📊 자산 추세 데이터

```python
asset_trend = {
    "periods": ["1개월", "3개월", "1년"],
    "daily_data": [
        {"date": "2025-09-01", "total_assets": 145000000},
        {"date": "2025-09-02", "total_assets": 147500000},
        # ... 시계열 데이터
    ]
}
```

### 2. 상세 포트폴리오 시트

<img width="1239" height="454" alt="상세구조 시트" src="https://github.com/user-attachments/assets/6c30ba78-0368-4fef-aaad-1e9b0b0b86eb" />

#### 💱 환율 정보

```python
exchange_rates = {
    "USD/KRW": 1350.0,             # USD/KRW 환율
    "JPY/KRW": 9.2,                # JPY/KRW 환율
    "reference_date": "2025-09-14"  # 기준 일자
}
```

#### 📊 포트폴리오 상세 데이터

```python
portfolio_details = [
    {
        "stock_name": "삼성전자",           # 종목명
        "stock_code": "005930",            # 종목코드
        "quantity": 100,                   # 수량
        "average_price": 75000,            # 평균단가 (원)
        "current_price": 82000,            # 현재가 (원)
        "evaluation_amount": 8200000,      # 평가금액 (원)
        "return_rate": 9.33,               # 수익률 (%)
        "sector": "IT",                    # 섹터
        "purchase_date": "2025-08-15",     # 매수 시점
        "holding_days": 30                 # 보유기간 (일)
    },
    # ... 추가 종목들
]
```

#### 📈 요약 통계

```python
portfolio_summary = {
    "total_evaluation_amount": 150000000,  # 총 평가금액
    "weighted_average_return": 12.5        # 가중평균 수익률
}
```

#### 🏆 Top 5 데이터

```python
top5_by_value = [
    {"stock_name": "삼성전자", "evaluation_amount": 8200000},
    {"stock_name": "SK하이닉스", "evaluation_amount": 7500000},
    # ... 상위 5개 종목
]

top5_by_return = [
    {"stock_name": "NAVER", "return_rate": 25.3},
    {"stock_name": "카카오", "return_rate": 18.7},
    # ... 수익률 상위 5개 종목
]
```

## 🔌 API 구조

### 📊 데이터 입력 API

#### 1. 포트폴리오 데이터 업데이트

```python
def update_portfolio_data(portfolio_data: dict) -> bool:
    """
    포트폴리오 데이터 업데이트

    Args:
        portfolio_data: 포트폴리오 상세 데이터
    Returns:
        bool: 업데이트 성공 여부
    """
    pass
```

#### 2. 시계열 데이터 업데이트

```python
def update_timeseries_data(timeseries_data: list) -> bool:
    """
    시계열 데이터 업데이트

    Args:
        timeseries_data: 날짜별 자산 변화 데이터
    Returns:
        bool: 업데이트 성공 여부
    """
    pass
```

#### 3. 환율 데이터 업데이트

```python
def update_exchange_rates(exchange_rates: dict) -> bool:
    """
    환율 데이터 업데이트

    Args:
        exchange_rates: 환율 정보
    Returns:
        bool: 업데이트 성공 여부
    """
    pass
```

### 📈 보고서 생성 API

#### 1. 엑셀 보고서 생성

```python
def generate_excel_report(
    template_path: str,
    output_path: str,
    data: dict
) -> str:
    """
    엑셀 보고서 생성

    Args:
        template_path: 템플릿 파일 경로
        output_path: 출력 파일 경로
        data: 포트폴리오 데이터
    Returns:
        str: 생성된 파일 경로
    """
    pass
```

#### 2. AI 피드백 생성

```python
def generate_ai_feedback(portfolio_data: dict) -> str:
    """
    AI 투자 피드백 생성

    Args:
        portfolio_data: 포트폴리오 데이터
    Returns:
        str: AI 피드백 텍스트
    """
    pass
```

### 🔍 데이터 조회 API

#### 1. 포트폴리오 요약 조회

```python
def get_portfolio_summary() -> dict:
    """
    포트폴리오 요약 정보 조회

    Returns:
        dict: 포트폴리오 요약 데이터
    """
    pass
```

#### 2. 시계열 데이터 조회

```python
def get_timeseries_data(period: str = "1개월") -> list:
    """
    시계열 데이터 조회

    Args:
        period: 조회 기간 ("1개월", "3개월", "1년", "전체")
    Returns:
        list: 시계열 데이터
    """
    pass
```

## 🚀 사용법

### 1. 설치

```bash
pip install -e .
```

### 2. 설정

```bash
# .env 파일 설정
cp .env.example .env
# 필요한 API 키 및 설정 입력
```

### 3. 실행

```bash
# 포트폴리오 보고서 생성
excel-report generate --data-file sample_data.json --output reports/portfolio_report.xlsx

# 상태 확인
excel-report status
```

## 📁 프로젝트 구조

```
excel-portfolio-reporter/
├── src/
│   ├── excel/
│   │   ├── sheets/          # 시트 생성 모듈
│   │   └── charts/          # 차트 생성 모듈
│   ├── ai/                  # AI 관련 모듈
│   └── utils/               # 유틸리티 함수
├── config/                  # 설정 파일
├── reports/                 # 생성된 보고서
└── tests/                   # 테스트 파일
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.
