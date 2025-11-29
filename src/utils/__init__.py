"""공통 유틸리티 함수 패키지"""

# 상위 디렉토리의 utils.py에서 함수 임포트
import sys
from pathlib import Path

# src/utils.py의 함수들을 임포트
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

try:
    from utils import safe_int_convert, safe_float_convert, setup_logging, setup_project_path
    __all__ = ['safe_int_convert', 'safe_float_convert', 'setup_logging', 'setup_project_path']
except ImportError:
    # Fallback: define inline
    def safe_int_convert(value: str, default: int = 0) -> int:
        try:
            return int(float(value)) if value else default
        except (ValueError, TypeError):
            return default
    
    __all__ = ['safe_int_convert']
