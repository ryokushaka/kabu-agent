# Overseas Stock Portfolio Manager (Kabu Agent)

**해외주식 포트폴리오 관리 시스템**은 한국투자증권(KIS) Open API를 활용하여 미국 주식 포트폴리오를 실시간으로 조회하고 분석하는 웹 애플리케이션입니다.
React 기반의 모던한 UI와 FastAPI 백엔드, 그리고 Google Gemini AI를 활용한 투자 피드백 기능을 제공합니다.

## 📊 주요 기능 및 화면

### 1. 대시보드 (Dashboard)
전체 자산 현황, 수익률, 자산 추이 및 AI 기반 뉴스 브리핑을 한눈에 확인할 수 있는 중앙 허브입니다.
![Dashboard](docs/images/dashboard.png)

- **실시간 자산 현황**: 총 자산(USD/KRW), 총 손익, 수익률을 실시간으로 집계하여 표시합니다.
- **자산 추이 그래프**: 1개월, 3개월, 1년, 전체 기간의 자산 변화를 시각적으로 추적할 수 있습니다.
- **AI 뉴스 브리핑**: 보유 종목 및 관심 키워드("미국 주식 시장")와 관련된 최신 뉴스를 DuckDuckGo로 검색하고, Gemini AI가 한국어로 요약하여 제공합니다. (Redis 캐싱 적용으로 빠른 로딩 지원)

### 2. 포트폴리오 관리 (Portfolio Management)
보유 중인 해외 주식의 상세 정보와 성과를 테이블 형태로 제공하며, 효율적인 자산 관리를 지원합니다.
![Portfolio](docs/images/portfolio.png)

- **종목 상세 정보**: 종목명, 티커, 보유 수량, 평균 단가, 현재가, 평가 금액, 평가 손익, 수익률 등을 상세히 표시합니다.
- **섹터 자동 분류**: 각 종목의 섹터(Technology, Financials 등)를 자동으로 식별하여 표시합니다.
- **엑셀 내보내기**: 현재 포트폴리오 상태를 엑셀 파일(.xlsx)로 다운로드하여 별도로 보관하거나 분석할 수 있습니다.

### 3. 자산 분석 (Analysis)
포트폴리오의 건전성을 평가하고 다각도로 분석하여 투자 인사이트를 제공합니다.
![Analysis](docs/images/analysis.png)

- **섹터 비중 분석**: 파이 차트를 통해 포트폴리오가 특정 섹터에 편중되지 않았는지 시각적으로 확인합니다.
- **수익률 기여도**: 어떤 종목이나 섹터가 전체 수익률에 가장 큰 영향을 미치는지 분석합니다.
- **AI 포트폴리오 진단**: Gemini AI가 포트폴리오 구성을 심층 분석하여 리스크 요인을 식별하고, 시장 상황에 맞는 리밸런싱 전략을 제안합니다. (Markdown 리포트 형식 제공)

### 4. 관리자 콘솔 (Admin Console)
시스템의 안정적인 운영을 위한 모니터링 및 관리 도구입니다.
![Admin](docs/images/admin.png)

- **시스템 상태 모니터링**: 한국투자증권(KIS) API 연결 상태, 데이터베이스 및 Redis 캐시 서버의 작동 여부를 실시간으로 확인합니다.
- **사용자 관리**: 가입된 사용자 목록을 조회하고, 계정 상태(활성/정지) 및 권한(관리자/일반)을 관리합니다.
- **API 사용량 통계**: 일일 API 호출 횟수와 엔드포인트별 사용량을 시각화하여 API 쿼터 초과를 방지합니다.

---

## � 기술 스택 (Tech Stack)

### Frontend
- **Framework**: React 18, Vite
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Context API
- **Charts**: Recharts

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15
- **Cache**: Redis 7 (KIS 토큰 및 데이터 캐싱)
- **API Integration**: KIS Open API, Google Gemini Pro

### DevOps
- **Container**: Docker, Docker Compose
- **Server**: Nginx (Reverse Proxy)

---

## 🚀 설치 및 실행 (Installation)

### 1. 환경 변수 설정
`.env` 파일을 생성하고 필요한 설정을 입력합니다.

```bash
cp .env.example .env
```

**필수 환경 변수:**
- `KIS_APP_KEY`: 한국투자증권 App Key
- `KIS_APP_SECRET`: 한국투자증권 App Secret
- `KIS_ACCOUNT_NUMBER`: 계좌번호 (8자리+2자리)
- `GEMINI_API_KEY`: Google Gemini API Key

### 2. Docker 실행
Docker Compose를 사용하여 전체 서비스를 실행합니다.

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Docs**: http://localhost:8000/docs

---

## � 프로젝트 구조

```
kabu-agent/
├── components/          # React Frontend Components
├── src/                 # Python Backend Source
│   ├── api/             # API Routes
│   ├── services/        # Business Logic (AI, Analysis)
│   ├── database/        # DB Models & Connection
│   └── kis_api.py       # KIS Open API Client
├── docs/                # Documentation & Images
├── init-db/             # Database Initialization Scripts
└── docker-compose.yml   # Docker Configuration
```

## 📄 라이선스
이 프로젝트는 MIT 라이선스 하에 배포됩니다.
