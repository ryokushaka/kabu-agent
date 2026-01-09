"""
권한 정의 모듈
"""
import json
from typing import List, Optional


class Permission:
    """권한 상수 정의"""
    # 사용자 관리
    USER_READ = "user:read"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"

    # 시스템 관리
    SYSTEM_MONITORING = "system:monitoring"
    SYSTEM_SETTINGS = "system:settings"
    SYSTEM_CACHE = "system:cache"

    # 감사 로그
    AUDIT_READ = "audit:read"

    # 알림 관리
    NOTIFICATION_MANAGE = "notification:manage"

    # 배치 작업
    BATCH_MANAGE = "batch:manage"


# 역할별 기본 권한 정의
DEFAULT_ROLES = {
    "user": [],
    "moderator": [
        Permission.USER_READ,
    ],
    "admin": [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.SYSTEM_MONITORING,
        Permission.AUDIT_READ,
        Permission.BATCH_MANAGE,
    ],
    "superadmin": ["*"],  # 모든 권한
}


def get_role_permissions(role: str) -> List[str]:
    """역할에 해당하는 권한 목록 반환"""
    return DEFAULT_ROLES.get(role, [])


def has_permission(user, permission: str) -> bool:
    """
    사용자가 특정 권한을 가지고 있는지 확인

    Args:
        user: User 모델 객체
        permission: 확인할 권한 문자열

    Returns:
        bool: 권한 보유 여부
    """
    # superadmin은 모든 권한 보유
    if user.role == "superadmin" or user.is_admin:
        return True

    # 역할 기반 권한 확인
    role_permissions = get_role_permissions(user.role)

    # 와일드카드 권한 확인
    if "*" in role_permissions:
        return True

    return permission in role_permissions


def get_user_permissions(user) -> List[str]:
    """
    사용자의 모든 권한 목록 반환

    Args:
        user: User 모델 객체

    Returns:
        List[str]: 권한 목록
    """
    if user.role == "superadmin" or user.is_admin:
        # 모든 권한 반환
        return [
            Permission.USER_READ,
            Permission.USER_CREATE,
            Permission.USER_UPDATE,
            Permission.USER_DELETE,
            Permission.SYSTEM_MONITORING,
            Permission.SYSTEM_SETTINGS,
            Permission.SYSTEM_CACHE,
            Permission.AUDIT_READ,
            Permission.NOTIFICATION_MANAGE,
            Permission.BATCH_MANAGE,
        ]

    return get_role_permissions(user.role)
