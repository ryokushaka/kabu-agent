---
globs: ["infra/**/*", "docker-compose*.yml", "Dockerfile*", ".github/**/*", "nginx/**/*", "*.yaml", "*.yml", "Makefile"]
description: "Infrastructure, Docker, and CI/CD rules"
---

# Infrastructure Development Rules

## Tech Stack

| Category | Choice | Rationale |
|----------|--------|-----------|
| Containerization | Docker | Industry standard, reproducibility |
| Orchestration | Docker Compose | Simple multi-container setup |
| Reverse Proxy | Nginx | Performance, flexibility |
| CI/CD | GitHub Actions | Native integration |

## Docker

### Dockerfile Best Practices

#### Multi-Stage Builds
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### Layer Optimization
```dockerfile
# Bad: invalidates cache on any change
COPY . .
RUN npm install

# Good: dependencies cached separately
COPY package*.json ./
RUN npm ci
COPY . .
```

#### Security
- Use specific version tags, never `latest`
- Run as non-root user
- Scan images with `docker scout` or Trivy
- Use `.dockerignore` to exclude sensitive files

```dockerfile
# .dockerignore
.git
.env
node_modules
*.log
```

### Docker Compose

#### Service Definition
```yaml
version: '3.8'

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

#### Environment Management
```yaml
# docker-compose.yml - base configuration
services:
  api:
    build: ./backend

# docker-compose.override.yml - development (auto-loaded)
services:
  api:
    volumes:
      - ./backend:/app
    environment:
      - DEBUG=true

# docker-compose.prod.yml - production
services:
  api:
    image: registry.example.com/api:${TAG}
    environment:
      - DEBUG=false
```

```bash
# Development (uses override automatically)
docker compose up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Nginx

### Reverse Proxy Configuration
```nginx
upstream api {
    server api:8000;
    keepalive 32;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name example.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api/ {
        proxy_pass http://api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static files caching
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;
}
```

## CI/CD

### GitHub Actions Workflow
```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests
        run: pytest --cov=src --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v4

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run ruff
        uses: chartboost/ruff-action@v1

  build:
    needs: [test, lint]
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### Branch Protection
```yaml
# Required status checks
- test
- lint

# Rules
- Require pull request reviews
- Require signed commits (optional)
- No force pushes to main
```

## Environment Variables

### Structure
```bash
# .env.example (commit this)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
SECRET_KEY=your-secret-key-here
DEBUG=false

# .env (never commit)
DATABASE_URL=postgresql://prod_user:secure_password@db.example.com:5432/prod_db
SECRET_KEY=actual-production-secret
DEBUG=false
```

### Secrets Management
- Use GitHub Secrets for CI/CD
- Use environment-specific `.env` files locally
- Consider Vault or AWS Secrets Manager for production
- Rotate secrets regularly

## Monitoring

### Health Checks
```python
# FastAPI health endpoint
@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": str(e)}
        )
```

### Logging Aggregation
```yaml
# docker-compose.yml logging configuration
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Makefile

### Common Commands
```makefile
.PHONY: dev build test deploy clean

# Development
dev:
	docker compose up --build

# Production build
build:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Run tests
test:
	docker compose run --rm api pytest

# Deploy
deploy:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Cleanup
clean:
	docker compose down -v --rmi local
	docker system prune -f

# Database migrations
migrate:
	docker compose exec api alembic upgrade head

migrate-create:
	docker compose exec api alembic revision --autogenerate -m "$(name)"
```

## Security Checklist

### Container Security
- [ ] Non-root user in containers
- [ ] Read-only root filesystem where possible
- [ ] No sensitive data in images
- [ ] Regular image updates and scanning

### Network Security
- [ ] Internal services not exposed publicly
- [ ] Firewall rules configured
- [ ] TLS for all external connections
- [ ] Rate limiting on API endpoints

### Secret Management
- [ ] No secrets in code or images
- [ ] Environment variables for configuration
- [ ] Secrets rotated regularly
- [ ] Access logged and audited
