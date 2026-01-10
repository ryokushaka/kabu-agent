# Kabu Agent - 海外株式ポートフォリオ管理システム

韓国投資証券(KIS) Open APIを活用した米国株式ポートフォリオのリアルタイム照会およびAI分析サービスです。

## 主要機能

### ホーム (ダッシュボード)
総資産状況とAIニュースブリーフィングを提供します。
![Dashboard](docs/images/dashboard.png)

- 総資産(USD/KRW)、損益、収益率のリアルタイム表示
- 資産推移グラフ (1ヶ月/3ヶ月/1年/全期間)
- AIニュースブリーフィング (Gemini AI基盤の韓国語要約)

### マイ株式 (ポートフォリオ)
保有銘柄の詳細情報とパフォーマンスを管理します。
![Portfolio](docs/images/portfolio.png)

- 銘柄別数量、平均取得価格、現在価格、評価損益、収益率
- セクター自動分類 (Technology, Financials など)
- Excelエクスポート (.xlsx)

### 資産分析
ポートフォリオの健全性評価とAI診断を提供します。
![Analysis](docs/images/analysis.png)

- セクター比重分析 (パイチャート)
- 収益率貢献度分析
- AIポートフォリオ診断 (リスク分析 + リバランス提案)

### 管理者コンソール
システム運用およびモニタリングツールです。
![Admin](docs/images/admin.png)

- システム状態モニタリング (KIS API, DB, Redis)
- ユーザー管理 (アカウント状態、権限)
- API使用量統計

---

## 技術スタック

### フロントエンド
| 技術 | バージョン | 用途 |
|-----|-----------|------|
| React | 19.2 | UIライブラリ |
| TypeScript | 5.8 | 型安全性 |
| Vite | 6.2 | ビルドツール |
| TanStack Query | 5.x | サーバー状態管理 |
| React Router | 7.9 | クライアントルーティング |
| TailwindCSS | 4.x | スタイリング (Tossデザインシステム) |
| Recharts | 3.5 | チャート |
| Lucide React | 0.554 | アイコン |
| i18next | 25.x | 多言語対応 (韓/英/日) |

### バックエンド
| 技術 | バージョン | 用途 |
|-----|-----------|------|
| FastAPI | 0.109 | Webフレームワーク |
| Python | 3.11 | ランタイム |
| PostgreSQL | 15 | データベース |
| Redis | 7 | キャッシュ (トークン、データ) |
| SQLAlchemy | 2.0 | ORM |
| Google Gemini | Pro | AI分析 |
| KIS Open API | - | 証券データ |

### DevOps & オブザーバビリティ
| 技術 | 用途 |
|-----|------|
| Docker, Docker Compose | コンテナ化 |
| Nginx | リバースプロキシ、Brotli圧縮 |
| GitHub Actions | CI/CD |
| ArgoCD | GitOpsデプロイ |
| Prometheus | メトリクス収集 |
| Grafana | ダッシュボード |
| OpenTelemetry | 分散トレーシング |
| Jaeger | トレーシング可視化 |

---

## インストール & 実行

### 1. 環境変数設定

```bash
cp .env.example .env
```

`.env`ファイルに以下の値を設定:

| 変数名 | 説明 | 必須 |
|-------|------|------|
| `DATABASE_URL` | PostgreSQL接続URL | O |
| `REDIS_URL` | Redis接続URL | O |
| `KIS_APP_KEY` | 韓国投資証券 App Key | O |
| `KIS_APP_SECRET` | 韓国投資証券 App Secret | O |
| `KIS_ACCOUNT_NUMBER` | 口座番号 (8桁-2桁) | O |
| `GEMINI_API_KEY` | Google Gemini API Key | O |
| `JWT_SECRET_KEY` | JWT署名キー | O |
| `VITE_API_BASE_URL` | フロントエンドAPI URL (Docker: 空欄) | - |

### 2. Docker実行

```bash
docker-compose up --build
```

| サービス | URL |
|---------|-----|
| フロントエンド | http://localhost:3000 |
| バックエンドAPI | http://localhost:8000 |
| APIドキュメント | http://localhost:8000/docs |

### 3. ローカル開発 (Dockerなし)

```bash
# フロントエンド
npm install
npm run dev

# バックエンド
pip install -r requirements.txt
uvicorn src.main:app --reload
```

### 4. テスト

```bash
# フロントエンドテスト
npm run test           # Watchモード
npm run test:run       # 単発実行
npm run test:coverage  # カバレッジ付き

# バックエンドテスト
pytest
```

---

## プロジェクト構造

```
kabu-agent/
├── src/
│   ├── app/                  # アプリエントリーポイント、ルーター、プロバイダー
│   │   ├── providers/        # QueryProvider, AuthProvider
│   │   └── router/           # AppRouter, ProtectedRoute
│   │
│   ├── pages/                # ページコンポーネント (ルート単位)
│   │   ├── dashboard/        # ホーム (ダッシュボード)
│   │   ├── portfolio/        # マイ株式
│   │   ├── analysis/         # 資産分析
│   │   ├── admin/            # 管理者
│   │   ├── settings/         # 設定
│   │   ├── login/            # ログイン
│   │   └── landing/          # ランディングページ
│   │
│   ├── features/             # 機能単位モジュール
│   │   ├── auth/             # 認証 (api, model, hooks)
│   │   ├── portfolio/        # ポートフォリオ照会
│   │   ├── analysis/         # 分析機能
│   │   ├── ai-analysis/      # AI分析
│   │   ├── exchange-rate/    # 為替レート
│   │   └── glossary/         # 用語辞典
│   │
│   ├── entities/             # ドメインエンティティ
│   │   ├── stock/            # 株式 (api, model, ui)
│   │   ├── user/             # ユーザー
│   │   └── news/             # ニュース
│   │
│   ├── widgets/              # 複合UIブロック
│   │   ├── app-layout/       # アプリレイアウト
│   │   ├── header/           # ヘッダー
│   │   └── sidebar/          # サイドバー
│   │
│   ├── shared/               # 共有モジュール
│   │   ├── api/              # APIクライアント
│   │   ├── ui/               # 共通UIコンポーネント
│   │   ├── lib/              # ユーティリティ関数
│   │   ├── types/            # 共通型
│   │   └── config/           # 設定
│   │
│   ├── api/                  # バックエンドAPIルート (Python)
│   ├── services/             # バックエンドサービス
│   ├── database/             # DB接続
│   ├── cache/                # Redisキャッシュ
│   └── kis_api.py            # KIS Open APIクライアント
│
├── docs/                     # ドキュメント
├── infra/                    # インフラ設定 (Terraform等)
├── init-db/                  # DB初期化スクリプト
├── nginx/                    # Nginx設定
├── tests/                    # テストコード
└── docker-compose.yml        # Docker構成
```

**アーキテクチャ**: Feature-Sliced Design (FSD)パターンを適用し、関心の分離とモジュール化を実現しています。

---

## ドキュメント

| ドキュメント | 説明 |
|------------|------|
| [フロントエンドアーキテクチャ](docs/FRONTEND_ARCHITECTURE.md) | FSD構造、データフロー、使用パターン |
| [システム要件](docs/system-requirements.md) | 機能要件、非機能要件 |

---

## ライセンス

MIT License
