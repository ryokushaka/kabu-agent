# Kabu Agent - Overseas Stock Portfolio Management System

Real-time US stock portfolio tracking and AI-powered analysis service using Korea Investment & Securities (KIS) Open API.

## Key Features

### Home (Dashboard)
Provides total asset overview and AI news briefing.
![Dashboard](docs/images/dashboard.png)

- Real-time display of total assets (USD/KRW), P&L, and returns
- Asset trend graph (1 month/3 months/1 year/all)
- AI news briefing (Korean summary powered by Gemini AI)

### My Stocks (Portfolio)
Manages detailed holdings information and performance.
![Portfolio](docs/images/portfolio.png)

- Quantity, average price, current price, unrealized P&L, and returns per stock
- Automatic sector classification (Technology, Financials, etc.)
- Excel export (.xlsx)

### Asset Analysis
Provides portfolio health assessment and AI diagnosis.
![Analysis](docs/images/analysis.png)

- Sector weight analysis (pie chart)
- Return contribution analysis
- AI portfolio diagnosis (risk analysis + rebalancing suggestions)

### Admin Console
System operations and monitoring tools.
![Admin](docs/images/admin.png)

- System status monitoring (KIS API, DB, Redis)
- User management (account status, permissions)
- API usage statistics

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2 | UI library |
| TypeScript | 5.8 | Type safety |
| Vite | 6.2 | Build tool |
| TanStack Query | 5.x | Server state management |
| React Router | 7.9 | Client-side routing |
| TailwindCSS | 4.x | Styling (Toss design system) |
| Recharts | 3.5 | Charts |
| Lucide React | 0.554 | Icons |
| i18next | 25.x | Internationalization (KO/EN/JA) |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| FastAPI | 0.109 | Web framework |
| Python | 3.11 | Runtime |
| PostgreSQL | 15 | Database |
| Redis | 7 | Cache (tokens, data) |
| SQLAlchemy | 2.0 | ORM |
| Google Gemini | Pro | AI analysis |
| KIS Open API | - | Securities data |

### DevOps & Observability
| Technology | Purpose |
|------------|---------|
| Docker, Docker Compose | Containerization |
| Nginx | Reverse proxy, Brotli compression |
| GitHub Actions | CI/CD |
| ArgoCD | GitOps deployment |
| Prometheus | Metrics collection |
| Grafana | Dashboards |
| OpenTelemetry | Distributed tracing |
| Jaeger | Tracing visualization |

---

## Installation & Running

### 1. Environment Variables Setup

```bash
cp .env.example .env
```

Set the following values in `.env` file:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection URL | Yes |
| `REDIS_URL` | Redis connection URL | Yes |
| `KIS_APP_KEY` | Korea Investment Securities App Key | Yes |
| `KIS_APP_SECRET` | Korea Investment Securities App Secret | Yes |
| `KIS_ACCOUNT_NUMBER` | Account number (8 digits-2 digits) | Yes |
| `GEMINI_API_KEY` | Google Gemini API Key | Yes |
| `JWT_SECRET_KEY` | JWT signing key | Yes |
| `VITE_API_BASE_URL` | Frontend API URL (Docker: leave empty) | No |

### 2. Run with Docker

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### 3. Local Development (Without Docker)

```bash
# Frontend
npm install
npm run dev

# Backend
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### 4. Testing

```bash
# Frontend tests
npm run test           # Watch mode
npm run test:run       # Single run
npm run test:coverage  # With coverage

# Backend tests
pytest
```

---

## Project Structure

```
kabu-agent/
├── src/
│   ├── app/                  # App entry point, router, providers
│   │   ├── providers/        # QueryProvider, AuthProvider
│   │   └── router/           # AppRouter, ProtectedRoute
│   │
│   ├── pages/                # Page components (per route)
│   │   ├── dashboard/        # Home (dashboard)
│   │   ├── portfolio/        # My stocks
│   │   ├── analysis/         # Asset analysis
│   │   ├── admin/            # Admin
│   │   ├── settings/         # Settings
│   │   ├── login/            # Login
│   │   └── landing/          # Landing page
│   │
│   ├── features/             # Feature modules
│   │   ├── auth/             # Authentication (api, model, hooks)
│   │   ├── portfolio/        # Portfolio queries
│   │   ├── analysis/         # Analysis features
│   │   ├── ai-analysis/      # AI analysis
│   │   ├── exchange-rate/    # Exchange rates
│   │   └── glossary/         # Glossary
│   │
│   ├── entities/             # Domain entities
│   │   ├── stock/            # Stock (api, model, ui)
│   │   ├── user/             # User
│   │   └── news/             # News
│   │
│   ├── widgets/              # Composite UI blocks
│   │   ├── app-layout/       # App layout
│   │   ├── header/           # Header
│   │   └── sidebar/          # Sidebar
│   │
│   ├── shared/               # Shared modules
│   │   ├── api/              # API client
│   │   ├── ui/               # Common UI components
│   │   ├── lib/              # Utility functions
│   │   ├── types/            # Common types
│   │   └── config/           # Configuration
│   │
│   ├── api/                  # Backend API Routes (Python)
│   ├── services/             # Backend Services
│   ├── database/             # DB connection
│   ├── cache/                # Redis cache
│   └── kis_api.py            # KIS Open API client
│
├── docs/                     # Documentation
├── infra/                    # Infrastructure config (Terraform, etc.)
├── init-db/                  # DB initialization scripts
├── nginx/                    # Nginx configuration
├── tests/                    # Test code
└── docker-compose.yml        # Docker configuration
```

**Architecture**: Implements Feature-Sliced Design (FSD) pattern for separation of concerns and modularization.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Frontend Architecture](docs/FRONTEND_ARCHITECTURE.md) | FSD structure, data flow, usage patterns |
| [System Requirements](docs/system-requirements.md) | Functional & non-functional requirements |

---

## License

MIT License
