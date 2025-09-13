"""
공통 유틸리티 함수들
Common utility functions for the KIS data acquisition system
"""
import logging
import sys
from pathlib import Path
from config.settings import settings


def setup_logging(log_filename: str = 'portfolio.log') -> logging.Logger:
    """
    통합 로깅 설정
    Unified logging setup for the application
    """
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    
    # 기존 핸들러 제거 (중복 방지)
    root_logger = logging.getLogger()
    if root_logger.handlers:
        root_logger.handlers.clear()
    
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_filename)
        ]
    )
    
    return logging.getLogger(__name__)


def setup_project_path() -> Path:
    """
    프로젝트 루트 경로 설정
    Setup project root path and add to sys.path
    """
    project_root = Path(__file__).parent.parent
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))
    return project_root




def safe_float_convert(value: str, default: float = 0.0) -> float:
    """
    안전한 float 변환
    Safe conversion of string to float with default fallback
    """
    try:
        return float(value) if value else default
    except (ValueError, TypeError):
        return default


def safe_int_convert(value: str, default: int = 0) -> int:
    """
    안전한 int 변환
    Safe conversion of string to int with default fallback
    """
    try:
        return int(float(value)) if value else default
    except (ValueError, TypeError):
        return default