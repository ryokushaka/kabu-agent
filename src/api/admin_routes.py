"""
관리자 API (배치 작업 모니터링)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import select

from src.auth.dependencies import get_current_active_user
from src.database.models import User, BatchJobLog
from src.database.connection import db_manager
from src.services.scheduler import scheduler

router = APIRouter(prefix="/api/admin", tags=["Admin"])


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


@router.get("/jobs/status", response_model=List[BatchJobStatusResponse])
async def get_job_status(current_user: User = Depends(get_current_active_user)):
    """배치 작업 상태 조회"""
    # TODO: 실제 관리자 권한 체크 로직 추가 필요
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")

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
    current_user: User = Depends(get_current_active_user)
):
    """배치 작업 로그 조회"""
    # TODO: 실제 관리자 권한 체크 로직 추가 필요
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")

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
    current_user: User = Depends(get_current_active_user)
):
    """특정 배치 작업의 최신 로그 조회"""
    # TODO: 실제 관리자 권한 체크 로직 추가 필요
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")

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
    current_user: User = Depends(get_current_active_user)
):
    """배치 작업 통계 조회"""
    # TODO: 실제 관리자 권한 체크 로직 추가 필요
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")

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
