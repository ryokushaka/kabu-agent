"""
알림 API 라우터
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal
import logging

from sqlalchemy.orm import Session
from sqlalchemy import desc
from src.database.connection import get_db
from src.database.models import User, Notification, PriceAlert
from src.auth.dependencies import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class NotificationResponse(BaseModel):
    """알림 응답"""
    id: str
    type: str
    title: str
    message: str
    is_read: bool
    metadata: Optional[Dict[str, Any]] = None
    created_at: str

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """알림 목록 응답"""
    notifications: List[NotificationResponse]
    total: int
    unread_count: int


class PriceAlertCreate(BaseModel):
    """가격 알림 생성"""
    ticker: str
    target_price: float
    condition: str  # 'above', 'below'


class PriceAlertResponse(BaseModel):
    """가격 알림 응답"""
    id: str
    ticker: str
    target_price: float
    condition: str
    is_active: bool
    triggered_at: Optional[str] = None
    created_at: str

    class Config:
        from_attributes = True


class NotificationStats(BaseModel):
    """알림 통계"""
    total: int
    unread: int
    by_type: Dict[str, int]


@router.get("", response_model=NotificationListResponse)
async def get_notifications(
    limit: int = Query(50, ge=1, le=100),
    include_read: bool = True,
    notification_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    알림 목록 조회

    Args:
        limit: 조회 개수
        include_read: 읽은 알림 포함 여부
        notification_type: 알림 유형 필터

    Returns:
        알림 목록
    """
    try:
        query = db.query(Notification).filter(Notification.user_id == current_user.id)

        if not include_read:
            query = query.filter(Notification.is_read == False)

        if notification_type:
            query = query.filter(Notification.type == notification_type)

        notifications = query.order_by(desc(Notification.created_at)).limit(limit).all()

        # 읽지 않은 알림 수
        unread_count = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()

        total = query.count()

        notification_list = []
        for n in notifications:
            metadata = None
            if n.notification_metadata:
                try:
                    import json
                    metadata = json.loads(n.notification_metadata)
                except:
                    pass

            notification_list.append(NotificationResponse(
                id=str(n.id),
                type=n.type,
                title=n.title,
                message=n.message,
                is_read=n.is_read,
                metadata=metadata,
                created_at=n.created_at.isoformat()
            ))

        return NotificationListResponse(
            notifications=notification_list,
            total=total,
            unread_count=unread_count
        )

    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=NotificationStats)
async def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    알림 통계 조회

    Returns:
        알림 통계
    """
    try:
        total = db.query(Notification).filter(
            Notification.user_id == current_user.id
        ).count()

        unread = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).count()

        # 유형별 통계
        from sqlalchemy import func
        type_counts = db.query(
            Notification.type,
            func.count(Notification.id)
        ).filter(
            Notification.user_id == current_user.id
        ).group_by(Notification.type).all()

        by_type = {t: c for t, c in type_counts}

        return NotificationStats(
            total=total,
            unread=unread,
            by_type=by_type
        )

    except Exception as e:
        logger.error(f"Error fetching notification stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    알림 읽음 처리

    Args:
        notification_id: 알림 ID

    Returns:
        처리 결과
    """
    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        ).first()

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        notification.is_read = True
        db.commit()

        return {"success": True, "message": "Notification marked as read"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/read-all")
async def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    모든 알림 읽음 처리

    Returns:
        처리 결과
    """
    try:
        updated = db.query(Notification).filter(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        ).update({"is_read": True})

        db.commit()

        return {"success": True, "updated_count": updated}

    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    알림 삭제

    Args:
        notification_id: 알림 ID

    Returns:
        삭제 결과
    """
    try:
        notification = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        ).first()

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        db.delete(notification)
        db.commit()

        return {"success": True, "message": "Notification deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Price Alert Endpoints

@router.get("/alerts", response_model=List[PriceAlertResponse])
async def get_price_alerts(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    가격 알림 목록 조회

    Args:
        active_only: 활성 알림만 조회

    Returns:
        가격 알림 목록
    """
    try:
        query = db.query(PriceAlert).filter(PriceAlert.user_id == current_user.id)

        if active_only:
            query = query.filter(PriceAlert.is_active == True)

        alerts = query.order_by(desc(PriceAlert.created_at)).all()

        return [
            PriceAlertResponse(
                id=str(a.id),
                ticker=a.ticker,
                target_price=float(a.target_price),
                condition=a.condition,
                is_active=a.is_active,
                triggered_at=a.triggered_at.isoformat() if a.triggered_at else None,
                created_at=a.created_at.isoformat()
            )
            for a in alerts
        ]

    except Exception as e:
        logger.error(f"Error fetching price alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts", response_model=PriceAlertResponse)
async def create_price_alert(
    alert: PriceAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    가격 알림 생성

    Args:
        alert: 알림 정보

    Returns:
        생성된 알림
    """
    try:
        if alert.condition not in ('above', 'below'):
            raise HTTPException(status_code=400, detail="Condition must be 'above' or 'below'")

        # 동일한 알림이 있는지 확인
        existing = db.query(PriceAlert).filter(
            PriceAlert.user_id == current_user.id,
            PriceAlert.ticker == alert.ticker.upper(),
            PriceAlert.target_price == alert.target_price,
            PriceAlert.condition == alert.condition,
            PriceAlert.is_active == True
        ).first()

        if existing:
            raise HTTPException(status_code=400, detail="Identical alert already exists")

        new_alert = PriceAlert(
            user_id=current_user.id,
            ticker=alert.ticker.upper(),
            target_price=Decimal(str(alert.target_price)),
            condition=alert.condition,
            is_active=True
        )

        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

        return PriceAlertResponse(
            id=str(new_alert.id),
            ticker=new_alert.ticker,
            target_price=float(new_alert.target_price),
            condition=new_alert.condition,
            is_active=new_alert.is_active,
            triggered_at=None,
            created_at=new_alert.created_at.isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating price alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/alerts/{alert_id}")
async def delete_price_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    가격 알림 삭제

    Args:
        alert_id: 알림 ID

    Returns:
        삭제 결과
    """
    try:
        alert = db.query(PriceAlert).filter(
            PriceAlert.id == alert_id,
            PriceAlert.user_id == current_user.id
        ).first()

        if not alert:
            raise HTTPException(status_code=404, detail="Price alert not found")

        db.delete(alert)
        db.commit()

        return {"success": True, "message": "Price alert deleted"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting price alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/alerts/{alert_id}/toggle")
async def toggle_price_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    가격 알림 활성화/비활성화 토글

    Args:
        alert_id: 알림 ID

    Returns:
        토글 결과
    """
    try:
        alert = db.query(PriceAlert).filter(
            PriceAlert.id == alert_id,
            PriceAlert.user_id == current_user.id
        ).first()

        if not alert:
            raise HTTPException(status_code=404, detail="Price alert not found")

        alert.is_active = not alert.is_active
        db.commit()

        return {
            "success": True,
            "is_active": alert.is_active,
            "message": f"Price alert {'activated' if alert.is_active else 'deactivated'}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling price alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))
