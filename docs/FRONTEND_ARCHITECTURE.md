# 프론트엔드 아키텍처 문서

## 목차

1. [기술 스택](#기술-스택)
2. [FSD 아키텍처](#fsd-아키텍처)
3. [계층별 상세](#계층별-상세)
4. [데이터 흐름](#데이터-흐름)
5. [사용 패턴](#사용-패턴)
6. [개발 가이드](#개발-가이드)

---

## 기술 스택

| 기술 | 버전 | 용도 |
|-----|------|------|
| React | 19 | UI 라이브러리 |
| TypeScript | 5.8 | 타입 안전성 |
| Vite | 6.2 | 빌드 도구 및 개발 서버 |
| TanStack Query | 5.x | 서버 상태 관리 |
| React Router | 7.9 | 클라이언트 라우팅 |
| TailwindCSS | 4.x | 스타일링 (Toss 디자인 시스템) |
| Recharts | 3.5 | 차트 및 그래프 |
| Lucide React | 0.554 | 아이콘 |
| Vitest | 4.x | 테스트 |

---

## FSD 아키텍처

Feature-Sliced Design (FSD) 패턴을 적용하여 관심사 분리와 모듈화를 구현했습니다.

### 계층 구조

```
┌─────────────────────────────────────────┐
│                  app                     │  ← 앱 초기화, 라우팅
├─────────────────────────────────────────┤
│                 pages                    │  ← 라우트 단위 페이지
├─────────────────────────────────────────┤
│                widgets                   │  ← 복합 UI 블록
├─────────────────────────────────────────┤
│               features                   │  ← 기능 단위 모듈
├─────────────────────────────────────────┤
│               entities                   │  ← 도메인 엔티티
├─────────────────────────────────────────┤
│                shared                    │  ← 공유 모듈
└─────────────────────────────────────────┘
```

**의존성 규칙**: 상위 계층은 하위 계층만 참조할 수 있습니다.
- `app` → `pages` → `widgets` → `features` → `entities` → `shared`

### 디렉토리 구조

```
src/
├── app/                      # 앱 계층
│   ├── index.tsx             # 앱 진입점
│   ├── providers/            # 전역 프로바이더
│   │   ├── QueryProvider.tsx
│   │   └── index.ts
│   └── router/               # 라우팅
│       ├── AppRouter.tsx
│       ├── ProtectedRoute.tsx
│       └── index.ts
│
├── pages/                    # 페이지 계층
│   ├── dashboard/
│   │   ├── ui/
│   │   │   └── DashboardPage.tsx
│   │   └── index.ts
│   ├── portfolio/
│   ├── analysis/
│   ├── admin/
│   ├── settings/
│   ├── login/
│   ├── landing/
│   ├── news/
│   ├── stock-detail/
│   └── index.ts
│
├── widgets/                  # 위젯 계층
│   ├── app-layout/
│   │   ├── ui/
│   │   │   └── AppLayout.tsx
│   │   └── index.ts
│   ├── header/
│   ├── sidebar/
│   └── index.ts
│
├── features/                 # 기능 계층
│   ├── auth/
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── model/
│   │   │   ├── AuthContext.tsx
│   │   │   └── useAuth.ts
│   │   └── index.ts
│   ├── portfolio/
│   │   ├── api/
│   │   │   └── portfolioApi.ts
│   │   ├── model/
│   │   │   └── usePortfolio.ts
│   │   └── index.ts
│   ├── analysis/
│   ├── ai-analysis/
│   ├── exchange-rate/
│   ├── glossary/
│   └── index.ts
│
├── entities/                 # 엔티티 계층
│   ├── stock/
│   │   ├── api/
│   │   │   └── stockApi.ts
│   │   ├── model/
│   │   │   └── types.ts
│   │   ├── ui/
│   │   │   └── StockCard.tsx
│   │   └── index.ts
│   ├── user/
│   ├── news/
│   └── index.ts
│
└── shared/                   # 공유 계층
    ├── api/
    │   ├── client.ts         # API 클라이언트
    │   ├── queryClient.ts    # TanStack Query 설정
    │   └── index.ts
    ├── ui/
    │   ├── ErrorBoundary.tsx
    │   ├── ErrorDisplay.tsx
    │   ├── LoadingSpinner.tsx
    │   ├── OptimizedImage.tsx
    │   └── index.ts
    ├── lib/
    │   ├── formatters.ts     # 포맷팅 유틸리티
    │   ├── webVitals.ts
    │   └── index.ts
    ├── types/
    │   ├── api.ts
    │   └── index.ts
    ├── config/
    │   ├── constants.ts
    │   └── index.ts
    └── index.ts
```

---

## 계층별 상세

### app (앱 계층)

앱 초기화, 전역 프로바이더, 라우팅을 담당합니다.

```typescript
// src/app/index.tsx
export const App: React.FC = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </QueryProvider>
  );
};
```

### pages (페이지 계층)

라우트 단위 페이지 컴포넌트입니다. 각 페이지는 `ui/` 폴더에 컴포넌트를 배치합니다.

| 페이지 | 경로 | 설명 |
|-------|------|------|
| DashboardPage | `/dashboard` | 홈 (대시보드) |
| PortfolioPage | `/portfolio` | 내 주식 |
| AnalysisPage | `/analysis` | 자산 분석 |
| AdminPage | `/admin` | 관리자 |
| SettingsPage | `/settings` | 설정 |
| LoginPage | `/login` | 로그인 |
| LandingPage | `/` | 랜딩 |

### widgets (위젯 계층)

페이지에서 사용되는 복합 UI 블록입니다.

| 위젯 | 설명 |
|-----|------|
| AppLayout | 앱 전체 레이아웃 (사이드바 + 헤더 + 콘텐츠) |
| Header | 상단 헤더 (모바일 메뉴 토글) |
| Sidebar | 사이드 네비게이션 (메뉴 항목, 로그아웃) |

### features (기능 계층)

비즈니스 로직을 담당하는 기능 모듈입니다.

| 기능 | 설명 | 주요 Hook |
|-----|------|----------|
| auth | 인증 (로그인/로그아웃) | `useAuth` |
| portfolio | 포트폴리오 조회 | `usePortfolio`, `usePortfolioSummary` |
| analysis | 섹터/수익률 분석 | `useAnalysis`, `useSectorAnalysis` |
| ai-analysis | AI 포트폴리오 진단 | `useAIAnalysis` |
| exchange-rate | 환율 조회 | `useExchangeRate`, `useUSDToKRW` |
| glossary | 용어 사전 | `useGlossary` |

각 기능 모듈의 구조:
```
features/auth/
├── api/            # API 호출 함수
│   └── authApi.ts
├── model/          # 상태 관리, 커스텀 훅
│   ├── AuthContext.tsx
│   └── useAuth.ts
└── index.ts        # public API
```

### entities (엔티티 계층)

도메인 엔티티와 관련 UI를 담당합니다.

| 엔티티 | 설명 |
|-------|------|
| stock | 주식 (타입, API, StockCard) |
| user | 사용자 (타입) |
| news | 뉴스 (타입, NewsCard) |

### shared (공유 계층)

모든 계층에서 사용하는 공유 모듈입니다.

| 모듈 | 설명 |
|-----|------|
| api | API 클라이언트, QueryClient 설정 |
| ui | 공통 UI 컴포넌트 (ErrorBoundary, LoadingSpinner) |
| lib | 유틸리티 함수 (formatters) |
| types | 공통 타입 정의 |
| config | 상수, 환경 변수 |

---

## 데이터 흐름

### 전체 흐름

```
User Action
    ↓
Page Component (UI)
    ↓
Feature Hook (Business Logic)
    ↓
TanStack Query (State Management)
    ↓ (Cache Miss)
API Client (HTTP)
    ↓
Backend (FastAPI)
    ↑
Response
    ↓
TanStack Query Cache (5분)
    ↓
Component Re-render
```

### 인증 흐름

```
Login Form
    ↓
useAuth.login({ username, password })
    ↓
authApi.login() - POST /token
    ↓
Backend OAuth2
    ↓
{ access_token: "..." }
    ↓
localStorage.setItem('access_token', token)
    ↓
navigate('/dashboard')
```

### 데이터 조회 흐름

```
Page 렌더링
    ↓
usePortfolioSummary() 호출
    ↓
TanStack Query 캐시 확인
    ↓
캐시 있음? → 즉시 반환
    ↓
캐시 없음? → portfolioApi.getSummary()
    ↓
apiClient.get('/api/portfolio/summary')
    ↓
Authorization: Bearer {token} 자동 주입
    ↓
Backend API
    ↓
Response 캐시 저장 (5분)
    ↓
Component 자동 리렌더링
```

---

## 사용 패턴

### 1. 데이터 조회

```typescript
import { usePortfolioSummary } from '@/features/portfolio';
import { LoadingSpinner, ErrorDisplay } from '@/shared/ui';

const MyComponent = () => {
  const { data, isLoading, error, refetch } = usePortfolioSummary();

  if (isLoading) return <LoadingSpinner message="로딩 중..." />;
  if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
  if (!data) return null;

  return (
    <div>
      <h1>총 자산: ${data.total_assets}</h1>
      <button onClick={() => refetch()}>새로고침</button>
    </div>
  );
};
```

### 2. 인증

```typescript
import { useAuth } from '@/features/auth';

const LoginPage = () => {
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username: email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {loginError && <p className="text-red-500">{loginError.message}</p>}
      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};
```

### 3. Protected Route

```typescript
import { useAuth } from '@/features/auth';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### 4. API 호출

```typescript
import { apiClient } from '@/shared/api';

// GET 요청
const data = await apiClient.get('/api/endpoint');

// POST 요청
const result = await apiClient.post('/api/endpoint', { key: 'value' });
```

---

## 개발 가이드

### 개발 서버

```bash
npm run dev          # http://localhost:5173
```

### 빌드

```bash
npm run build        # 프로덕션 빌드 (/dist)
```

### 테스트

```bash
npm run test         # 테스트 실행 (watch 모드)
npm run test:run     # 테스트 실행 (단일)
npm run test:coverage # 커버리지 리포트
```

### 환경 변수

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000

# .env.production (Docker)
VITE_API_BASE_URL=
```

### TanStack Query 설정

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5분간 신선한 상태
      gcTime: 10 * 60 * 1000,          // 10분간 캐시 보관
      refetchOnWindowFocus: false,     // 포커스 시 자동 갱신 비활성화
      retry: 3,                        // 3회 재시도
    }
  }
});
```

### 스타일링 (Toss 디자인 시스템)

```typescript
// 색상 클래스
className="text-toss-grey-900"      // 텍스트
className="bg-toss-grey-100"        // 배경
className="border-toss-grey-200"    // 테두리
className="text-blue-600"           // 프라이머리
className="text-toss-red"           // 에러

// 레이아웃
className="rounded-xl"              // 둥근 모서리
className="shadow-md shadow-blue-200" // 그림자
```

---

## 참고 자료

- [Feature-Sliced Design](https://feature-sliced.design/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com/)
- [Vite](https://vitejs.dev/)
- [TailwindCSS](https://tailwindcss.com/)

---

**마지막 업데이트**: 2026-01-09
