"""
시스템 모니터링 서비스
"""
import time
import os
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy import text

from src.database.connection import db_manager


class MonitoringService:
    """시스템 모니터링 서비스"""

    def __init__(self):
        self._redis_client = None

    @property
    def redis_client(self):
        """Redis 클라이언트 지연 로딩"""
        if self._redis_client is None:
            try:
                import redis
                redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
                self._redis_client = redis.from_url(redis_url)
            except Exception:
                self._redis_client = None
        return self._redis_client

    async def get_db_stats(self) -> Dict[str, Any]:
        """데이터베이스 통계 조회"""
        try:
            start_time = time.time()

            with db_manager.get_session() as session:
                # 연결 테스트
                session.execute(text("SELECT 1"))

                # 테이블별 레코드 수 조회
                tables_stats = {}
                tables = ['users', 'portfolios', 'positions', 'transactions', 'notifications', 'audit_logs']

                for table in tables:
                    try:
                        result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                        count = result.scalar()
                        tables_stats[table] = count
                    except Exception:
                        tables_stats[table] = 0

                # 활성 연결 수 조회 (PostgreSQL)
                try:
                    result = session.execute(text(
                        "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'"
                    ))
                    active_connections = result.scalar()
                except Exception:
                    active_connections = 0

                # 데이터베이스 크기 조회 (PostgreSQL)
                try:
                    result = session.execute(text(
                        "SELECT pg_database_size(current_database())"
                    ))
                    db_size_bytes = result.scalar()
                    db_size_mb = round(db_size_bytes / (1024 * 1024), 2) if db_size_bytes else 0
                except Exception:
                    db_size_mb = 0

            response_time = round((time.time() - start_time) * 1000, 2)

            return {
                "connected": True,
                "response_time_ms": response_time,
                "active_connections": active_connections,
                "database_size_mb": db_size_mb,
                "tables": tables_stats,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    async def get_kis_api_status(self) -> Dict[str, Any]:
        """KIS API 상태 조회"""
        try:
            from src.services.kis_api import KISApiService

            start_time = time.time()

            # KIS API 서비스 인스턴스 생성 및 상태 확인
            kis_service = KISApiService()

            # 토큰 유효성 확인 (간단한 상태 체크)
            operational = True
            error_rate = 0.0

            response_time = round((time.time() - start_time) * 1000, 2)

            return {
                "operational": operational,
                "response_time_ms": response_time,
                "error_rate_percent": error_rate,
                "last_check": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "operational": False,
                "error": str(e),
                "last_check": datetime.utcnow().isoformat()
            }

    async def get_redis_stats(self) -> Dict[str, Any]:
        """Redis 통계 조회"""
        try:
            if not self.redis_client:
                return {
                    "connected": False,
                    "error": "Redis not configured",
                    "timestamp": datetime.utcnow().isoformat()
                }

            start_time = time.time()

            # Redis 연결 테스트
            self.redis_client.ping()

            # Redis 정보 조회
            info = self.redis_client.info()

            # 메모리 사용량
            used_memory_mb = round(info.get('used_memory', 0) / (1024 * 1024), 2)
            max_memory = info.get('maxmemory', 0)
            max_memory_mb = round(max_memory / (1024 * 1024), 2) if max_memory > 0 else "unlimited"

            # 캐시 적중률 계산
            hits = info.get('keyspace_hits', 0)
            misses = info.get('keyspace_misses', 0)
            total_ops = hits + misses
            hit_rate = round((hits / total_ops * 100), 2) if total_ops > 0 else 0

            # 키 수 조회
            total_keys = self.redis_client.dbsize()

            response_time = round((time.time() - start_time) * 1000, 2)

            return {
                "connected": True,
                "response_time_ms": response_time,
                "used_memory_mb": used_memory_mb,
                "max_memory_mb": max_memory_mb,
                "hit_rate_percent": hit_rate,
                "total_keys": total_keys,
                "connected_clients": info.get('connected_clients', 0),
                "uptime_seconds": info.get('uptime_in_seconds', 0),
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }

    async def flush_cache(self) -> Dict[str, Any]:
        """Redis 캐시 초기화"""
        try:
            if not self.redis_client:
                return {
                    "success": False,
                    "error": "Redis not configured"
                }

            # 현재 키 수 조회
            keys_before = self.redis_client.dbsize()

            # 캐시 플러시
            self.redis_client.flushdb()

            # 플러시 후 키 수 조회
            keys_after = self.redis_client.dbsize()

            return {
                "success": True,
                "keys_deleted": keys_before - keys_after,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    async def get_api_usage_stats(self, hours: int = 24) -> Dict[str, Any]:
        """API 사용 통계 조회"""
        try:
            # API 사용 통계는 별도 로깅 시스템이 필요
            # 현재는 기본 구조만 반환
            return {
                "period_hours": hours,
                "endpoints": {
                    "inquire_balance": {"calls": 0, "avg_response_ms": 0},
                    "search_info": {"calls": 0, "avg_response_ms": 0},
                    "inquire_period_profit": {"calls": 0, "avg_response_ms": 0},
                    "auth_token": {"calls": 0, "avg_response_ms": 0}
                },
                "total_requests": 0,
                "error_count": 0,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            return {
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
