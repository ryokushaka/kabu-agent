"""
인증 의존성 모듈
"""
from typing import Optional, Callable
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models import User
from src.auth.jwt_handler import jwt_handler
from src.auth.permissions import has_permission, Permission


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """현재 인증된 사용자 정보 가져오기"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # 토큰에서 사용자 ID 추출
        user_id = jwt_handler.get_user_id_from_token(credentials.credentials)
        if user_id is None:
            raise credentials_exception
            
    except Exception:
        raise credentials_exception
    
    # 데이터베이스에서 사용자 조회
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
        
    # 사용자가 비활성 상태인지 확인
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """현재 활성화된 사용자 정보 가져오기"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """선택적 인증 - 토큰이 없어도 허용"""
    if not credentials:
        return None

    try:
        user_id = jwt_handler.get_user_id_from_token(credentials.credentials)
        if user_id is None:
            return None

        user = db.query(User).filter(User.id == user_id).first()
        return user if user and user.is_active else None

    except Exception:
        return None


async def get_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """관리자 권한 체크"""
    if not current_user.is_admin and current_user.role not in ('admin', 'superadmin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def require_permission(permission: str) -> Callable:
    """
    특정 권한을 요구하는 의존성 팩토리

    사용 예시:
        @router.get("/users")
        async def get_users(user: User = Depends(require_permission(Permission.USER_READ))):
            ...
    """
    async def check_permission(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if not has_permission(current_user, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}"
            )
        return current_user

    return check_permission