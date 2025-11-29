# Kabu Agent Makefile

.PHONY: help dev dev-db prod build clean logs status stop restart

# Default target
help:
	@echo "Kabu Agent - 사용 가능한 명령어:"
	@echo ""
	@echo "개발 환경:"
	@echo "  make dev        - 전체 개발 환경 시작 (DB + Backend + Frontend)"
	@echo "  make dev-db     - DB와 관리도구만 시작 (로컬 개발용)"
	@echo ""
	@echo "프로덕션 환경:"
	@echo "  make prod       - 프로덕션 환경 시작"
	@echo "  make build      - Docker 이미지 빌드"
	@echo ""
	@echo "관리:"
	@echo "  make logs       - 모든 서비스 로그 확인"
	@echo "  make status     - 서비스 상태 확인"
	@echo "  make stop       - 서비스 중지"
	@echo "  make restart    - 서비스 재시작"
	@echo "  make clean      - 모든 컨테이너와 볼륨 삭제"
	@echo ""

# 개발 환경 (전체)
dev:
	@echo "🚀 전체 개발 환경을 시작합니다..."
	./scripts/start-all.sh

# 개발 환경 (DB만)
dev-db:
	@echo "🗄️ DB와 관리도구만 시작합니다..."
	./scripts/start-dev.sh

# 프로덕션 환경
prod:
	@echo "🏭 프로덕션 환경을 시작합니다..."
	./scripts/start-prod.sh

# 이미지 빌드
build:
	@echo "🔨 Docker 이미지를 빌드합니다..."
	docker-compose build --no-cache
	docker-compose -f docker-compose.dev.yml build --no-cache

# 로그 확인
logs:
	@echo "📋 서비스 로그를 확인합니다..."
	@read -p "어떤 환경의 로그를 확인하시겠습니까? (dev/prod): " env; \
	if [ "$$env" = "prod" ]; then \
		docker-compose logs -f; \
	else \
		docker-compose -f docker-compose.dev.yml logs -f; \
	fi

# 상태 확인
status:
	@echo "📊 서비스 상태를 확인합니다..."
	@echo "=== 개발 환경 ==="
	@docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "개발 환경이 실행되지 않음"
	@echo ""
	@echo "=== 프로덕션 환경 ==="
	@docker-compose ps 2>/dev/null || echo "프로덕션 환경이 실행되지 않음"

# 서비스 중지
stop:
	@echo "🛑 서비스를 중지합니다..."
	@read -p "어떤 환경을 중지하시겠습니까? (dev/prod/all): " env; \
	if [ "$$env" = "prod" ]; then \
		docker-compose stop; \
	elif [ "$$env" = "all" ]; then \
		docker-compose stop; \
		docker-compose -f docker-compose.dev.yml stop; \
	else \
		docker-compose -f docker-compose.dev.yml stop; \
	fi

# 서비스 재시작
restart:
	@echo "🔄 서비스를 재시작합니다..."
	@read -p "어떤 환경을 재시작하시겠습니까? (dev/prod): " env; \
	if [ "$$env" = "prod" ]; then \
		docker-compose restart; \
	else \
		docker-compose -f docker-compose.dev.yml restart; \
	fi

# 정리
clean:
	@echo "🧹 모든 컨테이너와 볼륨을 삭제합니다..."
	@read -p "정말로 모든 데이터를 삭제하시겠습니까? (y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		docker-compose down -v; \
		docker-compose -f docker-compose.dev.yml down -v; \
		docker system prune -f; \
		echo "✅ 정리 완료"; \
	else \
		echo "❌ 취소됨"; \
	fi

# 헬스체크
health:
	@echo "🏥 서비스 헬스체크..."
	@echo "백엔드: $(shell curl -s http://localhost:8000/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo '연결 불가')"
	@echo "프론트엔드: $(shell curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 2>/dev/null | grep -q 200 && echo '정상' || echo '연결 불가')"

# 개발용 유틸리티
shell-backend:
	@echo "🐚 백엔드 컨테이너 접속..."
	@docker exec -it kabu-backend-dev bash 2>/dev/null || docker exec -it kabu-backend bash 2>/dev/null || echo "백엔드 컨테이너가 실행되지 않음"

shell-frontend:
	@echo "🐚 프론트엔드 컨테이너 접속..."
	@docker exec -it kabu-frontend-dev sh 2>/dev/null || docker exec -it kabu-frontend sh 2>/dev/null || echo "프론트엔드 컨테이너가 실행되지 않음"

shell-db:
	@echo "🐚 데이터베이스 접속..."
	@docker exec -it kabu-postgres-dev psql -U kabu_dev -d kabu_agent_dev 2>/dev/null || docker exec -it kabu-postgres psql -U kabu_user -d kabu_agent 2>/dev/null || echo "데이터베이스 컨테이너가 실행되지 않음"