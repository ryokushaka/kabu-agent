"""
데이터베이스 연결 설정
"""
import os
import logging
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
from typing import Generator

from .models import Base

logger = logging.getLogger(__name__)


class DatabaseManager:
    """데이터베이스 연결 관리자"""
    
    def __init__(self):
        self.database_url = os.getenv(
            "DATABASE_URL", 
            "postgresql://kabu_user:kabu_password@localhost:5432/kabu_agent"
        )
        self.engine = None
        self.SessionLocal = None
        self._initialize_database()
    
    def _initialize_database(self):
        """데이터베이스 초기화"""
        try:
            # SQLAlchemy 엔진 생성
            self.engine = create_engine(
                self.database_url,
                poolclass=QueuePool,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=300,
                echo=os.getenv("DEBUG", "false").lower() == "true"
            )
            
            # 연결 이벤트 리스너 설정
            @event.listens_for(self.engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                if self.database_url.startswith("sqlite"):
                    cursor = dbapi_connection.cursor()
                    cursor.execute("PRAGMA foreign_keys=ON")
                    cursor.close()
            
            # 세션 팩토리 생성
            self.SessionLocal = sessionmaker(
                autocommit=False, 
                autoflush=False, 
                bind=self.engine
            )
            
            logger.info("데이터베이스 연결 초기화 완료")
            
        except Exception as e:
            logger.error(f"데이터베이스 초기화 실패: {e}")
            raise
    
    def create_tables(self):
        """테이블 생성"""
        try:
            Base.metadata.create_all(bind=self.engine)
            logger.info("데이터베이스 테이블 생성 완료")
        except Exception as e:
            logger.error(f"테이블 생성 실패: {e}")
            raise
    
    def get_session(self) -> Session:
        """데이터베이스 세션 반환"""
        if not self.SessionLocal:
            self._initialize_database()
        return self.SessionLocal()
    
    @contextmanager
    def get_session_context(self) -> Generator[Session, None, None]:
        """컨텍스트 매니저로 세션 관리"""
        session = self.get_session()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"데이터베이스 세션 에러: {e}")
            raise
        finally:
            session.close()
    
    def health_check(self) -> bool:
        """데이터베이스 연결 상태 확인"""
        try:
            with self.get_session_context() as session:
                session.execute(text("SELECT 1"))
                return True
        except Exception as e:
            logger.error(f"데이터베이스 헬스체크 실패: {e}")
            return False
    
    def close(self):
        """데이터베이스 연결 종료"""
        if self.engine:
            self.engine.dispose()
            logger.info("데이터베이스 연결 종료")


# 글로벌 데이터베이스 매니저 인스턴스
db_manager = DatabaseManager()


def get_db() -> Generator[Session, None, None]:
    """FastAPI 의존성 주입용 데이터베이스 세션"""
    session = db_manager.get_session()
    try:
        yield session
    except Exception as e:
        session.rollback()
        logger.error(f"데이터베이스 세션 에러: {e}")
        raise
    finally:
        session.close()


def init_database():
    """데이터베이스 초기화 (앱 시작시 호출)"""
    try:
        db_manager.create_tables()
        logger.info("데이터베이스 초기화 완료")
    except Exception as e:
        logger.error(f"데이터베이스 초기화 실패: {e}")
        raise