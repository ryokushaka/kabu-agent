# 프론트엔드 아키텍처 문서

## 📚 목차

1. [기술 스택](#기술-스택)
2. [프로젝트 구조](#프로젝트-구조)
3. [아키텍처 패턴](#아키텍처-패턴)
4. [데이터 흐름](#데이터-흐름)
5. [사용 방법](#사용-방법)
6. [개발 워크플로우](#개발-워크플로우)

---

## 🛠 기술 스택

| 기술 | 버전 | 용도 |
|-----|------|------|
| **React** | 19 | UI 라이브러리 |
| **TypeScript** | 5.8 | 타입 안전성 |
| **Vite** | 6.2 | 빌드 도구 및 개발 서버 |
| **TanStack Query** | latest | 서버 상태 관리 |
| **React Router** | 7.9 | 클라이언트 라우팅 |
| **TailwindCSS** | - | 스타일링 |
| **Recharts** | 3.5 | 차트 및 그래프 |
| **Lucide React** | 0.554 | 아이콘 |

---

## 📁 프로젝트 구조

```
kabu-agent/
├── components/
│   ├── common/              # 공통 컴포넌트
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorDisplay.tsx
│   │   └── index.ts
│   ├── features/            # 기능별 컴포넌트
│   │   ├── auth/
│   │   │   └── LoginScreen.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard-new.tsx
│   │   └── portfolio/
│   ├── layout/              # 레이아웃
│   │   ├── AppLayout.tsx
│   │   └── Sidebar.tsx
│   └── [기존 컴포넌트들]
│
├── hooks/                   # Custom Hooks
│   ├── useAuth.ts           # 인증
│   ├── usePortfolio.ts      # 포트폴리오 데이터
│   ├── useExchangeRate.ts   # 환율
│   └── index.ts
│
├── services/
│   └── api/                 # API 레이어
│       ├── client.ts        # API 클라이언트
│       ├── auth.ts          # 인증 API
│       ├── portfolio.ts     # 포트폴리오 API
│       ├── exchange.ts      # 환율 API
│       └── index.ts
│
├── types/                   # TypeScript 타입
│   ├── api.ts               # API 응답 타입
│   ├── domain.ts            # 도메인 모델
│   └── index.ts
│
├── utils/                   # 유틸리티
│   └── formatters.ts        # 포맷팅 함수
│
├── .env.development         # 개발 환경 변수
├── .env.production          # 프로덕션 환경 변수
├── App.tsx                  # 애플리케이션 루트
└── index.tsx                # 엔트리 포인트
```

### 디렉토리별 역할

| 디렉토리 | 역할 | 예시 |
|---------|------|------|
| `components/common/` | 재사용 가능한 UI 컴포넌트 | ErrorBoundary, LoadingSpinner |
| `components/features/` | 기능별 컴포넌트 | auth/, dashboard/, portfolio/ |
| `components/layout/` | 레이아웃 컴포넌트 | AppLayout, Sidebar |
| `hooks/` | 비즈니스 로직 및 상태 관리 | useAuth, usePortfolio |
| `services/api/` | 백엔드 통신 로직 | client, auth, portfolio |
| `types/` | TypeScript 타입 정의 | API 응답, 도메인 모델 |
| `utils/` | 순수 함수 및 헬퍼 | formatCurrency, formatDate |

---

## 🏗️ 아키텍처 패턴

### 계층 구조

```
┌─────────────────────────────────────────┐
│         UI Layer (Components)           │
│    components/common, features, layout  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Business Logic (Hooks)             │
│    hooks/useAuth, usePortfolio, etc.    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     State Management (TanStack Query)   │
│      자동 캐싱, 백그라운드 갱신          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      API Layer (Services)               │
│    services/api/client, portfolio, etc  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Backend (FastAPI)                 │
│         http://localhost:8000           │
└─────────────────────────────────────────┘
```

### 1. 상태 관리 (TanStack Query)

서버 상태는 TanStack Query로 관리합니다.

**설정** (`index.tsx`):
```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5분간 신선한 상태 유지
      gcTime: 10 * 60 * 1000,          // 10분간 캐시 보관
      refetchOnWindowFocus: false,     // 윈도우 포커스시 자동 갱신 비활성화
      retry: 3,                        // 실패시 3회 재시도
      retryDelay: (attemptIndex) =>    // 지수 백오프
        Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**장점**:
- 자동 캐싱 (5분)
- 백그라운드 자동 갱신
- 중복 요청 제거
- 로딩/에러 상태 자동 관리
- 컴포넌트 간 상태 공유

### 2. Custom Hooks

비즈니스 로직을 hooks로 분리하여 재사용성을 높입니다.

#### `hooks/useAuth.ts` - 인증

```typescript
export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authApi.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.access_token);
      navigate('/');
    }
  });

  return {
    login: loginMutation.mutate,
    logout: () => { authApi.logout(); navigate('/login'); },
    isAuthenticated: authApi.isAuthenticated(),
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error
  };
};
```

사용 예:
```typescript
const { login, isLoggingIn, loginError } = useAuth();
login({ username: 'user@example.com', password: 'password' });
```

#### `hooks/usePortfolio.ts` - 포트폴리오 데이터

```typescript
export const usePortfolioSummary = () => {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: portfolioApi.getSummary,
    staleTime: 5 * 60 * 1000
  });
};

export const usePortfolioBalance = () => { /* ... */ };
export const usePortfolioHistory = (days = 30) => { /* ... */ };
export const useSectorAnalysis = () => { /* ... */ };
```

사용 예:
```typescript
const { data, isLoading, error, refetch } = usePortfolioSummary();
```

#### `hooks/useExchangeRate.ts` - 환율

```typescript
export const useUSDToKRW = () => {
  const { data, isLoading, error } = useExchangeRate('USD', 'KRW');

  // 에러시 기본값 1400 반환
  const rate = error ? 1400 : (data?.rate || 1400);

  return { rate, isLoading, error };
};
```

### 3. API 클라이언트

**기본 클라이언트** (`services/api/client.ts`):

```typescript
class ApiClient {
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { timeout = 10000, requiresAuth = true } = config;
    const token = localStorage.getItem('access_token');

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(requiresAuth && token && { 'Authorization': `Bearer ${token}` })
    };

    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...config,
        headers,
        signal: controller.signal
      });

      // 401 자동 처리
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        window.location.href = '/#/login';
        throw new ApiError('Session expired', 401);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data: unknown): Promise<T>
  async put<T>(endpoint: string, data: unknown): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
}
```

**API 엔드포인트** (`services/api/portfolio.ts`):

```typescript
export const portfolioApi = {
  getBalance: () =>
    apiClient.get<PortfolioBalance>('/api/portfolio/balance'),

  getSummary: () =>
    apiClient.get<PortfolioSummary>('/api/portfolio/summary'),

  getHistory: (days: number) =>
    apiClient.get<HistoryData[]>(`/api/portfolio/history?days=${days}`)
};
```

### 4. 에러 처리

3단계 에러 처리 시스템:

#### 1) ErrorBoundary - 런타임 에러

```typescript
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

React 런타임 에러를 캐치하고 fallback UI를 표시합니다.

#### 2) ErrorDisplay - 컴포넌트 레벨

```typescript
if (error) return <ErrorDisplay error={error} onRetry={refetch} />;
```

HTTP 상태 코드에 따라 적절한 에러 메시지를 표시합니다.

#### 3) ApiError - API 레벨

```typescript
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
  }
}
```

### 5. 코드 스플리팅

라우트별로 코드를 분할하여 초기 번들 크기를 줄입니다.

```typescript
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Portfolio = lazy(() => import('./components/PortfolioList'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/portfolio" element={<Portfolio />} />
    </Routes>
  </Suspense>
);
```

### 6. 환경 변수

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8000

# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com
```

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 🔄 데이터 흐름

### 전체 흐름도

```
User Action
    ↓
Component (UI)
    ↓
Custom Hook (Business Logic)
    ↓
TanStack Query (State Management)
    ↓ (Cache Miss)
API Client (HTTP)
    ↓
Backend (FastAPI)
    ↑
Response
    ↓
TanStack Query Cache
    ↓
Custom Hook
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
queryClient.invalidateQueries()
    ↓
navigate('/')
```

### 데이터 조회 흐름

```
Dashboard 렌더링
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

### 에러 처리 흐름

```
API 에러 발생
    ↓
ApiError 객체 생성 (status, message, data)
    ↓
401? → 자동 로그아웃 + 로그인 페이지 이동
    ↓
기타 에러? → TanStack Query error 상태
    ↓
Custom Hook error 반환
    ↓
Component
    ↓
<ErrorDisplay error={error} onRetry={refetch} />
```

---

## 💻 사용 방법

### 패턴 1: 데이터 조회

```typescript
import { usePortfolioSummary } from '../hooks/usePortfolio';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorDisplay } from '../components/common/ErrorDisplay';

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

### 패턴 2: 인증

```typescript
import { useAuth } from '../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username: email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      {loginError && <p className="error">{loginError.message}</p>}

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit" disabled={isLoggingIn}>
        {isLoggingIn ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};
```

### 패턴 3: API 호출

```typescript
import { apiClient } from '../services/api';

// GET 요청
const data = await apiClient.get('/api/endpoint');

// POST 요청
const result = await apiClient.post('/api/endpoint', { key: 'value' });

// Mutation (데이터 변경)
import { useMutation, useQueryClient } from '@tanstack/react-query';

const useCreateItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiClient.post('/api/items', data),
    onSuccess: () => {
      // 캐시 무효화하여 데이터 자동 갱신
      queryClient.invalidateQueries(['items']);
    }
  });
};

const { mutate, isPending } = useCreateItem();
mutate({ name: 'New Item' });
```

### 패턴 4: Protected Route

```typescript
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 사용
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

---

## 🔧 개발 워크플로우

### 1. 개발 서버 실행

```bash
npm run dev
```

Vite 개발 서버가 http://localhost:3000 에서 시작됩니다.

### 2. 프로덕션 빌드

```bash
npm run build
```

최적화된 빌드가 `/dist` 디렉토리에 생성됩니다.

### 3. 타입 체크

```bash
tsc --noEmit
```

### 4. 환경별 빌드

```bash
# 개발 환경
npm run dev

# 프로덕션 환경
npm run build
```

---

## 📊 캐싱 전략

### TanStack Query 캐시 설정

```typescript
{
  staleTime: 5 * 60 * 1000,    // 5분: 데이터를 신선한 상태로 간주
  gcTime: 10 * 60 * 1000,      // 10분: 사용하지 않는 캐시 보관 시간
  refetchOnWindowFocus: false, // 윈도우 포커스시 자동 갱신 비활성화
  retry: 3                     // 실패시 3회 재시도
}
```

### 로컬 스토리지

- **인증 토큰**: `access_token` (JWT)
- **인증 상태**: `isAuthenticated` (boolean)

---

## 🔐 보안

1. **JWT 토큰**: localStorage에 저장 (프로덕션에서는 httpOnly 쿠키 고려)
2. **CSRF 방어**: 토큰 기반 인증
3. **XSS 방어**: React가 기본적으로 이스케이프 처리
4. **API 보안**: 모든 요청에 인증 필요
5. **환경 변수**: `.env` 파일은 `.gitignore`에 포함

---

## 📚 참고 자료

- [TanStack Query 문서](https://tanstack.com/query/latest)
- [React Router 문서](https://reactrouter.com/)
- [Vite 문서](https://vitejs.dev/)
- [TypeScript 문서](https://www.typescriptlang.org/)
- [TailwindCSS 문서](https://tailwindcss.com/)

---

**마지막 업데이트**: 2024-11-29
