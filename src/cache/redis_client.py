"""
Redis 캐시 클라이언트
"""
import os
import json
import logging
from typing import Optional, Any, Union
from datetime import datetime, timedelta
import redis
from redis.exceptions import ConnectionError, RedisError

logger = logging.getLogger(__name__)


class RedisCache:
    """Redis 캐시 클라이언트"""
    
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self.redis_client = None
        self.is_connected = False
        self._initialize_client()
    
    def _initialize_client(self):
        """Redis 클라이언트 초기화"""
        try:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            
            # 연결 테스트
            self.redis_client.ping()
            self.is_connected = True
            logger.info("Redis 연결 초기화 완료")
            
        except Exception as e:
            logger.warning(f"Redis 연결 실패, 캐시 없이 동작: {e}")
            self.is_connected = False
    
    def _ensure_connection(self) -> bool:
        """Redis 연결 상태 확인 및 재연결"""
        if not self.is_connected:
            self._initialize_client()
        
        try:
            if self.redis_client and self.is_connected:
                self.redis_client.ping()
                return True
        except Exception as e:
            logger.warning(f"Redis 연결 확인 실패: {e}")
            self.is_connected = False
            
        return False
    
    def set(self, key: str, value: Any, expire: Optional[int] = None) -> bool:
        """값 설정"""
        if not self._ensure_connection():
            return False
        
        try:
            # JSON 직렬화
            if isinstance(value, (dict, list)):
                value = json.dumps(value, default=str)
            elif not isinstance(value, str):
                value = str(value)
            
            result = self.redis_client.set(key, value, ex=expire)
            return bool(result)
            
        except Exception as e:
            logger.error(f"Redis set 실패 - key: {key}, error: {e}")
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """값 조회"""
        if not self._ensure_connection():
            return None
        
        try:
            value = self.redis_client.get(key)
            if value is None:
                return None
            
            # JSON 역직렬화 시도
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
                
        except Exception as e:
            logger.error(f"Redis get 실패 - key: {key}, error: {e}")
            return None
    
    def delete(self, key: str) -> bool:
        """키 삭제"""
        if not self._ensure_connection():
            return False
        
        try:
            result = self.redis_client.delete(key)
            return bool(result)
        except Exception as e:
            logger.error(f"Redis delete 실패 - key: {key}, error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """키 존재 확인"""
        if not self._ensure_connection():
            return False
        
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Redis exists 실패 - key: {key}, error: {e}")
            return False
    
    def expire(self, key: str, seconds: int) -> bool:
        """키 만료 시간 설정"""
        if not self._ensure_connection():
            return False
        
        try:
            return bool(self.redis_client.expire(key, seconds))
        except Exception as e:
            logger.error(f"Redis expire 실패 - key: {key}, error: {e}")
            return False
    
    def ttl(self, key: str) -> int:
        """키의 남은 만료 시간 조회"""
        if not self._ensure_connection():
            return -1
        
        try:
            return self.redis_client.ttl(key)
        except Exception as e:
            logger.error(f"Redis ttl 실패 - key: {key}, error: {e}")
            return -1
    
    def keys(self, pattern: str = "*") -> list:
        """패턴에 맞는 키 목록 조회"""
        if not self._ensure_connection():
            return []
        
        try:
            return self.redis_client.keys(pattern)
        except Exception as e:
            logger.error(f"Redis keys 실패 - pattern: {pattern}, error: {e}")
            return []
    
    def flush_db(self) -> bool:
        """현재 데이터베이스의 모든 키 삭제"""
        if not self._ensure_connection():
            return False
        
        try:
            self.redis_client.flushdb()
            logger.info("Redis 데이터베이스 클리어 완료")
            return True
        except Exception as e:
            logger.error(f"Redis flushdb 실패: {e}")
            return False
    
    def health_check(self) -> bool:
        """Redis 연결 상태 확인"""
        try:
            return self._ensure_connection() and self.redis_client.ping()
        except Exception:
            return False
    
    def close(self):
        """Redis 연결 종료"""
        if self.redis_client:
            try:
                self.redis_client.close()
                logger.info("Redis 연결 종료")
            except Exception as e:
                logger.error(f"Redis 연결 종료 실패: {e}")
        
        self.is_connected = False


# 글로벌 Redis 클라이언트 인스턴스
redis_cache = RedisCache()


def get_cache_key(prefix: str, *args) -> str:
    """캐시 키 생성 헬퍼"""
    return f"{prefix}:{''.join(str(arg) for arg in args)}"


def cache_result(key: str, expire: int = 3600):
    """함수 결과 캐싱 데코레이터"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            # 캐시에서 값 조회
            cached_value = redis_cache.get(key)
            if cached_value is not None:
                logger.debug(f"캐시 히트: {key}")
                return cached_value
            
            # 함수 실행 및 결과 캐싱
            result = func(*args, **kwargs)
            if result is not None:
                redis_cache.set(key, result, expire)
                logger.debug(f"캐시 설정: {key}")
            
            return result
        
        return wrapper
    return decorator