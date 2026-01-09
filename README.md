# Kabu Agent - 해외주식 포트폴리오 관리 시스템

한국투자증권(KIS) Open API를 활용한 미국 주식 포트폴리오 실시간 조회 및 AI 기반 분석 서비스입니다.

## 주요 기능

### 홈 (대시보드)
전체 자산 현황과 AI 뉴스 브리핑을 제공합니다.
![Dashboard](docs/images/dashboard.png)

- 총 자산(USD/KRW), 손익, 수익률 실시간 표시
- 자산 추이 그래프 (1개월/3개월/1년/전체)
- AI 뉴스 브리핑 (Gemini AI 기반 한국어 요약)

### 내 주식 (포트폴리오)
보유 종목 상세 정보와 성과를 관리합니다.
![Portfolio](docs/images/portfolio.png)

- 종목별 수량, 평균단가, 현재가, 평가손익, 수익률
- 섹터 자동 분류 (Technology, Financials 등)
- 엑셀 내보내기 (.xlsx)

### 자산 분석
포트폴리오 건전성 평가 및 AI 진단을 제공합니다.
![Analysis](docs/images/analysis.png)

- 섹터 비중 분석 (파이 차트)
- 수익률 기여도 분석
- AI 포트폴리오 진단 (리스크 분석 + 리밸런싱 제안)

### 관리자 콘솔
시스템 운영 및 모니터링 도구입니다.
![Admin](docs/images/admin.png)

- 시스템 상태 모니터링 (KIS API, DB, Redis)
- 사용자 관리 (계정 상태, 권한)
- API 사용량 통계

---

## 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|-----|------|------|
| React | 19 | UI 라이브러리 |
| TypeScript | 5.8 | 타입 안전성 |
| Vite | 6.2 | 빌드 도구 |
| TanStack Query | 5.x | 서버 상태 관리 |
| React Router | 7.9 | 클라이언트 라우팅 |
| TailwindCSS | 4.x | 스타일링 (Toss 디자인 시스템) |
| Recharts | 3.5 | 차트 |
| Lucide React | 0.554 | 아이콘 |

### Backend
| 기술 | 버전 | 용도 |
|-----|------|------|
| FastAPI | - | 웹 프레임워크 |
| Python | 3.11 | 런타임 |
| PostgreSQL | 15 | 데이터베이스 |
| Redis | 7 | 캐시 (토큰, 데이터) |
| Google Gemini | Pro | AI 분석 |
| KIS Open API | - | 증권 데이터 |

### DevOps
- Docker, Docker Compose
- Nginx (Reverse Proxy, Brotli 압축)
- GitHub Actions (CI/CD)

---

## 설치 및 실행

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 다음 값들을 설정:

| 변수명 | 설명 | 필수 |
|-------|------|------|
| `DATABASE_URL` | PostgreSQL 연결 URL | O |
| `REDIS_URL` | Redis 연결 URL | O |
| `KIS_APP_KEY` | 한국투자증권 App Key | O |
| `KIS_APP_SECRET` | 한국투자증권 App Secret | O |
| `KIS_ACCOUNT_NUMBER` | 계좌번호 (8자리-2자리) | O |
| `GEMINI_API_KEY` | Google Gemini API Key | O |
| `JWT_SECRET_KEY` | JWT 서명 키 | O |
| `VITE_API_BASE_URL` | 프론트엔드 API URL (Docker: 비워두기) | - |

### 2. Docker 실행

```bash
docker-compose up --build
```

| 서비스 | URL |
|-------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### 3. 로컬 개발 (Docker 없이)

```bash
# Frontend
npm install
npm run dev

# Backend
pip install -r requirements.txt
uvicorn src.main:app --reload
```

---

## 프로젝트 구조

```
kabu-agent/
├── src/
│   ├── app/                  # 앱 진입점, 라우터, 프로바이더
│   │   ├── providers/        # QueryProvider, AuthProvider
│   │   └── router/           # AppRouter, ProtectedRoute
│   │
│   ├── pages/                # 페이지 컴포넌트 (라우트 단위)
│   │   ├── dashboard/        # 홈 (대시보드)
│   │   ├── portfolio/        # 내 주식
│   │   ├── analysis/         # 자산 분석
│   │   ├── admin/            # 관리자
│   │   ├── settings/         # 설정
│   │   ├── login/            # 로그인
│   │   └── landing/          # 랜딩 페이지
│   │
│   ├── features/             # 기능 단위 모듈
│   │   ├── auth/             # 인증 (api, model, hooks)
│   │   ├── portfolio/        # 포트폴리오 조회
│   │   ├── analysis/         # 분석 기능
│   │   ├── ai-analysis/      # AI 분석
│   │   ├── exchange-rate/    # 환율
│   │   └── glossary/         # 용어 사전
│   │
│   ├── entities/             # 도메인 엔티티
│   │   ├── stock/            # 주식 (api, model, ui)
│   │   ├── user/             # 사용자
│   │   └── news/             # 뉴스
│   │
│   ├── widgets/              # 복합 UI 블록
│   │   ├── app-layout/       # 앱 레이아웃
│   │   ├── header/           # 헤더
│   │   └── sidebar/          # 사이드바
│   │
│   ├── shared/               # 공유 모듈
│   │   ├── api/              # API 클라이언트
│   │   ├── ui/               # 공통 UI 컴포넌트
│   │   ├── lib/              # 유틸리티 함수
│   │   ├── types/            # 공통 타입
│   │   └── config/           # 설정
│   │
│   ├── api/                  # Backend API Routes (Python)
│   ├── services/             # Backend Services
│   ├── database/             # DB 연결
│   ├── cache/                # Redis 캐시
│   └── kis_api.py            # KIS Open API 클라이언트
│
├── docs/                     # 문서
├── init-db/                  # DB 초기화 스크립트
├── nginx/                    # Nginx 설정
└── docker-compose.yml        # Docker 구성
```

**아키텍처**: Feature-Sliced Design (FSD) 패턴을 적용하여 관심사 분리 및 모듈화를 구현했습니다.

---

## 문서

| 문서 | 설명 |
|-----|------|
| [프론트엔드 아키텍처](docs/FRONTEND_ARCHITECTURE.md) | FSD 구조, 데이터 흐름, 사용 패턴 |
| [시스템 요구사항](docs/system-requirements.md) | 기능 요구사항, 비기능 요구사항 |

---

## 라이선스

MIT License
