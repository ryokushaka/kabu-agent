"""
관리자 API (사용자 관리, 시스템 모니터링, 배치 작업, 감사 로그)
"""
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr
from sqlalchemy import select, func, or_

from src.auth.dependencies import get_admin_user, require_permission
from src.auth.permissions import Permission
from src.database.models import User, BatchJobLog, AuditLog
from src.database.connection import db_manager

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ============ Pydantic 모델 정의 ============

class UserResponse(BaseModel):
    """사용자 응답 모델"""
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_verified: bool
    is_admin: bool
    role: str
    created_at: str
    last_login: Optional[str]

    class Config:
        from_attributes = True


class UserCreateRequest(BaseModel):
    """사용자 생성 요청 모델"""
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None
    is_admin: bool = False
    role: str = "user"


class UserUpdateRequest(BaseModel):
    """사용자 수정 요청 모델"""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    role: Optional[str] = None


class UserStatusRequest(BaseModel):
    """사용자 상태 변경 요청"""
    is_active: bool


class UserRoleRequest(BaseModel):
    """사용자 역할 변경 요청"""
    role: str
    is_admin: Optional[bool] = None


class UserListResponse(BaseModel):
    """사용자 목록 응답 모델"""
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


class BatchJobStatusResponse(BaseModel):
    """배치 작업 상태 응답 모델"""
    id: str
    name: str
    next_run: Optional[str]
    trigger: str


class BatchJobLogResponse(BaseModel):
    """배치 작업 로그 응답 모델"""
    id: str
    job_id: str
    status: str
    started_at: str
    completed_at: Optional[str]
    items_processed: int
    error_message: Optional[str]

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    """감사 로그 응답 모델"""
    id: str
    user_id: Optional[str]
    action: str
    resource_type: str
    resource_id: Optional[str]
    old_value: Optional[dict]
    new_value: Optional[dict]
    ip_address: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class SystemHealthResponse(BaseModel):
    """시스템 상태 응답 모델"""
    status: str
    database: dict
    kis_api: dict
    redis: dict
    timestamp: str


# ============ 감사 로그 헬퍼 함수 ============

def create_audit_log(
    session,
    user_id: Optional[UUID],
    action: str,
    resource_type: str,
    resource_id: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    ip_address: Optional[str] = None
):
    """감사 로그 생성"""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        old_value=json.dumps(old_value) if old_value else None,
        new_value=json.dumps(new_value) if new_value else None,
        ip_address=ip_address
    )
    session.add(audit_log)
    return audit_log


# ============ 사용자 관리 API ============

@router.get("/users", response_model=UserListResponse)
async def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    admin_user: User = Depends(require_permission(Permission.USER_READ))
):
    """사용자 목록 조회"""
    try:
        with db_manager.get_session() as session:
            query = select(User)

            # 검색 필터
            if search:
                search_filter = or_(
                    User.username.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.full_name.ilike(f"%{search}%")
                )
                query = query.where(search_filter)

            # 역할 필터
            if role:
                query = query.where(User.role == role)

            # 활성 상태 필터
            if is_active is not None:
                query = query.where(User.is_active == is_active)

            # 전체 개수 조회
            count_query = select(func.count()).select_from(query.subquery())
            total = session.execute(count_query).scalar()

            # 페이지네이션
            offset = (page - 1) * page_size
            query = query.order_by(User.created_at.desc()).limit(page_size).offset(offset)

            users = session.execute(query).scalars().all()

            return UserListResponse(
                users=[
                    UserResponse(
                        id=str(user.id),
                        email=user.email,
                        username=user.username,
                        full_name=user.full_name,
                        is_active=user.is_active,
                        is_verified=user.is_verified,
                        is_admin=user.is_admin if hasattr(user, 'is_admin') else False,
                        role=user.role if hasattr(user, 'role') else 'user',
                        created_at=user.created_at.isoformat() if user.created_at else None,
                        last_login=user.last_login.isoformat() if user.last_login else None
                    )
                    for user in users
                ],
                total=total,
                page=page,
                page_size=page_size
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    admin_user: User = Depends(require_permission(Permission.USER_READ))
):
    """특정 사용자 조회"""
    try:
        with db_manager.get_session() as session:
            user = session.execute(
                select(User).where(User.id == user_id)
            ).scalar_one_or_none()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            return UserResponse(
                id=str(user.id),
                email=user.email,
                username=user.username,
                full_name=user.full_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                is_admin=user.is_admin if hasattr(user, 'is_admin') else False,
                role=user.role if hasattr(user, 'role') else 'user',
                created_at=user.created_at.isoformat() if user.created_at else None,
                last_login=user.last_login.isoformat() if user.last_login else None
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users", response_model=UserResponse)
async def create_user(
    request: Request,
    user_data: UserCreateRequest,
    admin_user: User = Depends(require_permission(Permission.USER_CREATE))
):
    """사용자 생성"""
    try:
        with db_manager.get_session() as session:
            # 중복 체크
            existing = session.execute(
                select(User).where(
                    or_(User.email == user_data.email, User.username == user_data.username)
                )
            ).scalar_one_or_none()

            if existing:
                raise HTTPException(status_code=400, detail="Email or username already exists")

            # 사용자 생성
            new_user = User(
                email=user_data.email,
                username=user_data.username,
                hashed_password=User.hash_password(user_data.password),
                full_name=user_data.full_name,
                is_admin=user_data.is_admin,
                role=user_data.role,
                is_active=True,
                is_verified=False
            )
            session.add(new_user)

            # 감사 로그
            create_audit_log(
                session,
                admin_user.id,
                "CREATE_USER",
                "user",
                str(new_user.id),
                None,
                {"email": user_data.email, "username": user_data.username, "role": user_data.role},
                request.client.host if request.client else None
            )

            session.commit()
            session.refresh(new_user)

            return UserResponse(
                id=str(new_user.id),
                email=new_user.email,
                username=new_user.username,
                full_name=new_user.full_name,
                is_active=new_user.is_active,
                is_verified=new_user.is_verified,
                is_admin=new_user.is_admin,
                role=new_user.role,
                created_at=new_user.created_at.isoformat() if new_user.created_at else None,
                last_login=None
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    request: Request,
    user_id: str,
    user_data: UserUpdateRequest,
    admin_user: User = Depends(require_permission(Permission.USER_UPDATE))
):
    """사용자 수정"""
    try:
        with db_manager.get_session() as session:
            user = session.execute(
                select(User).where(User.id == user_id)
            ).scalar_one_or_none()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            old_value = {
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_admin": user.is_admin if hasattr(user, 'is_admin') else False,
                "role": user.role if hasattr(user, 'role') else 'user'
            }

            # 필드 업데이트
            if user_data.email is not None:
                user.email = user_data.email
            if user_data.full_name is not None:
                user.full_name = user_data.full_name
            if user_data.is_active is not None:
                user.is_active = user_data.is_active
            if user_data.is_admin is not None:
                user.is_admin = user_data.is_admin
            if user_data.role is not None:
                user.role = user_data.role

            new_value = {
                "email": user.email,
                "full_name": user.full_name,
                "is_active": user.is_active,
                "is_admin": user.is_admin,
                "role": user.role
            }

            # 감사 로그
            create_audit_log(
                session,
                admin_user.id,
                "UPDATE_USER",
                "user",
                user_id,
                old_value,
                new_value,
                request.client.host if request.client else None
            )

            session.commit()
            session.refresh(user)

            return UserResponse(
                id=str(user.id),
                email=user.email,
                username=user.username,
                full_name=user.full_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                is_admin=user.is_admin,
                role=user.role,
                created_at=user.created_at.isoformat() if user.created_at else None,
                last_login=user.last_login.isoformat() if user.last_login else None
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(
    request: Request,
    user_id: str,
    admin_user: User = Depends(require_permission(Permission.USER_DELETE))
):
    """사용자 삭제 (soft delete - 비활성화)"""
    try:
        with db_manager.get_session() as session:
            user = session.execute(
                select(User).where(User.id == user_id)
            ).scalar_one_or_none()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            # 자기 자신 삭제 방지
            if str(user.id) == str(admin_user.id):
                raise HTTPException(status_code=400, detail="Cannot delete yourself")

            old_value = {"is_active": user.is_active}
            user.is_active = False

            # 감사 로그
            create_audit_log(
                session,
                admin_user.id,
                "DELETE_USER",
                "user",
                user_id,
                old_value,
                {"is_active": False},
                request.client.host if request.client else None
            )

            session.commit()

            return {"message": "User deactivated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}/status")
async def update_user_status(
    request: Request,
    user_id: str,
    status_data: UserStatusRequest,
    admin_user: User = Depends(require_permission(Permission.USER_UPDATE))
):
    """사용자 상태 변경"""
    try:
        with db_manager.get_session() as session:
            user = session.execute(
                select(User).where(User.id == user_id)
            ).scalar_one_or_none()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            old_value = {"is_active": user.is_active}
            user.is_active = status_data.is_active

            # 감사 로그
            create_audit_log(
                session,
                admin_user.id,
                "UPDATE_USER_STATUS",
                "user",
                user_id,
                old_value,
                {"is_active": status_data.is_active},
                request.client.host if request.client else None
            )

            session.commit()

            return {"message": f"User {'activated' if status_data.is_active else 'deactivated'} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/users/{user_id}/role")
async def update_user_role(
    request: Request,
    user_id: str,
    role_data: UserRoleRequest,
    admin_user: User = Depends(require_permission(Permission.USER_UPDATE))
):
    """사용자 역할 변경"""
    valid_roles = ['user', 'moderator', 'admin', 'superadmin']
    if role_data.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")

    try:
        with db_manager.get_session() as session:
            user = session.execute(
                select(User).where(User.id == user_id)
            ).scalar_one_or_none()

            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            old_value = {
                "role": user.role if hasattr(user, 'role') else 'user',
                "is_admin": user.is_admin if hasattr(user, 'is_admin') else False
            }

            user.role = role_data.role
            if role_data.is_admin is not None:
                user.is_admin = role_data.is_admin
            elif role_data.role in ['admin', 'superadmin']:
                user.is_admin = True

            # 감사 로그
            create_audit_log(
                session,
                admin_user.id,
                "UPDATE_USER_ROLE",
                "user",
                user_id,
                old_value,
                {"role": user.role, "is_admin": user.is_admin},
                request.client.host if request.client else None
            )

            session.commit()

            return {"message": f"User role updated to {role_data.role}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ 시스템 모니터링 API ============

@router.get("/system/health", response_model=SystemHealthResponse)
async def get_system_health(
    admin_user: User = Depends(require_permission(Permission.SYSTEM_MONITORING))
):
    """시스템 전체 상태 조회"""
    from src.services.monitoring_service import MonitoringService

    try:
        monitoring = MonitoringService()
        db_status = await monitoring.get_db_stats()
        kis_status = await monitoring.get_kis_api_status()
        redis_status = await monitoring.get_redis_stats()

        overall_status = "healthy"
        if not db_status.get("connected") or not kis_status.get("operational"):
            overall_status = "degraded"

        return SystemHealthResponse(
            status=overall_status,
            database=db_status,
            kis_api=kis_status,
            redis=redis_status,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        return SystemHealthResponse(
            status="error",
            database={"connected": False, "error": str(e)},
            kis_api={"operational": False},
            redis={"connected": False},
            timestamp=datetime.utcnow().isoformat()
        )


@router.get("/system/kis-status")
async def get_kis_api_status(
    admin_user: User = Depends(require_permission(Permission.SYSTEM_MONITORING))
):
    """KIS API 상태 조회"""
    from src.services.monitoring_service import MonitoringService

    try:
        monitoring = MonitoringService()
        return await monitoring.get_kis_api_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system/db-stats")
async def get_db_stats(
    admin_user: User = Depends(require_permission(Permission.SYSTEM_MONITORING))
):
    """데이터베이스 통계 조회"""
    from src.services.monitoring_service import MonitoringService

    try:
        monitoring = MonitoringService()
        return await monitoring.get_db_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/system/redis-stats")
async def get_redis_stats(
    admin_user: User = Depends(require_permission(Permission.SYSTEM_MONITORING))
):
    """Redis 통계 조회"""
    from src.services.monitoring_service import MonitoringService

    try:
        monitoring = MonitoringService()
        return await monitoring.get_redis_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/system/cache/flush")
async def flush_cache(
    request: Request,
    admin_user: User = Depends(require_permission(Permission.SYSTEM_CACHE))
):
    """Redis 캐시 초기화"""
    from src.services.monitoring_service import MonitoringService

    try:
        monitoring = MonitoringService()
        result = await monitoring.flush_cache()

        # 감사 로그
        with db_manager.get_session() as session:
            create_audit_log(
                session,
                admin_user.id,
                "FLUSH_CACHE",
                "system",
                None,
                None,
                {"result": result},
                request.client.host if request.client else None
            )
            session.commit()

        return {"message": "Cache flushed successfully", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ 감사 로그 API ============

@router.get("/audit-logs")
async def get_audit_logs(
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    admin_user: User = Depends(require_permission(Permission.AUDIT_READ))
):
    """감사 로그 조회"""
    try:
        with db_manager.get_session() as session:
            query = select(AuditLog)

            if user_id:
                query = query.where(AuditLog.user_id == user_id)
            if action:
                query = query.where(AuditLog.action == action)
            if resource_type:
                query = query.where(AuditLog.resource_type == resource_type)
            if start_date:
                query = query.where(AuditLog.created_at >= datetime.fromisoformat(start_date))
            if end_date:
                query = query.where(AuditLog.created_at <= datetime.fromisoformat(end_date))

            # 전체 개수
            count_query = select(func.count()).select_from(query.subquery())
            total = session.execute(count_query).scalar()

            # 페이지네이션
            offset = (page - 1) * page_size
            query = query.order_by(AuditLog.created_at.desc()).limit(page_size).offset(offset)

            logs = session.execute(query).scalars().all()

            return {
                "logs": [
                    {
                        "id": str(log.id),
                        "user_id": str(log.user_id) if log.user_id else None,
                        "action": log.action,
                        "resource_type": log.resource_type,
                        "resource_id": log.resource_id,
                        "old_value": json.loads(log.old_value) if log.old_value else None,
                        "new_value": json.loads(log.new_value) if log.new_value else None,
                        "ip_address": log.ip_address,
                        "created_at": log.created_at.isoformat()
                    }
                    for log in logs
                ],
                "total": total,
                "page": page,
                "page_size": page_size
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ 배치 작업 API (기존 코드 업데이트) ============

@router.get("/jobs/status", response_model=List[BatchJobStatusResponse])
async def get_job_status(
    admin_user: User = Depends(require_permission(Permission.BATCH_MANAGE))
):
    """배치 작업 상태 조회"""
    from src.services.scheduler import scheduler

    try:
        jobs = []
        for job in scheduler.get_jobs():
            jobs.append(BatchJobStatusResponse(
                id=job.id,
                name=job.name,
                next_run=job.next_run_time.isoformat() if job.next_run_time else None,
                trigger=str(job.trigger)
            ))

        return jobs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/logs", response_model=List[BatchJobLogResponse])
async def get_job_logs(
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    admin_user: User = Depends(require_permission(Permission.BATCH_MANAGE))
):
    """배치 작업 로그 조회"""
    try:
        with db_manager.get_session() as session:
            query = select(BatchJobLog)

            if job_id:
                query = query.where(BatchJobLog.job_id == job_id)

            if status:
                query = query.where(BatchJobLog.status == status)

            query = query.order_by(BatchJobLog.started_at.desc()).limit(limit).offset(offset)

            logs = session.execute(query).scalars().all()

            return [
                BatchJobLogResponse(
                    id=str(log.id),
                    job_id=log.job_id,
                    status=log.status,
                    started_at=log.started_at.isoformat(),
                    completed_at=log.completed_at.isoformat() if log.completed_at else None,
                    items_processed=log.items_processed,
                    error_message=log.error_message
                )
                for log in logs
            ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/logs/{job_id}/latest", response_model=BatchJobLogResponse)
async def get_latest_job_log(
    job_id: str,
    admin_user: User = Depends(require_permission(Permission.BATCH_MANAGE))
):
    """특정 배치 작업의 최신 로그 조회"""
    try:
        with db_manager.get_session() as session:
            query = select(BatchJobLog).where(
                BatchJobLog.job_id == job_id
            ).order_by(BatchJobLog.started_at.desc()).limit(1)

            log = session.execute(query).scalar_one_or_none()

            if not log:
                raise HTTPException(status_code=404, detail="No logs found for this job")

            return BatchJobLogResponse(
                id=str(log.id),
                job_id=log.job_id,
                status=log.status,
                started_at=log.started_at.isoformat(),
                completed_at=log.completed_at.isoformat() if log.completed_at else None,
                items_processed=log.items_processed,
                error_message=log.error_message
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/jobs/stats")
async def get_job_stats(
    job_id: Optional[str] = None,
    admin_user: User = Depends(require_permission(Permission.BATCH_MANAGE))
):
    """배치 작업 통계 조회"""
    try:
        with db_manager.get_session() as session:
            query = select(BatchJobLog)

            if job_id:
                query = query.where(BatchJobLog.job_id == job_id)

            logs = session.execute(query).scalars().all()

            total = len(logs)
            success = sum(1 for log in logs if log.status == "success")
            failed = sum(1 for log in logs if log.status == "failed")
            running = sum(1 for log in logs if log.status == "running")

            success_rate = (success / total * 100) if total > 0 else 0

            return {
                "job_id": job_id or "all",
                "total_runs": total,
                "success_count": success,
                "failed_count": failed,
                "running_count": running,
                "success_rate": round(success_rate, 2)
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
