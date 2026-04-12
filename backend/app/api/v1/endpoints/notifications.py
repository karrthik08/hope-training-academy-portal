from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, and_
from typing import List
from datetime import datetime, timezone
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.notification import Notification, NotificationPreference
from app.api.v1.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: str
    related_id: str = None

@router.get("/my")
async def get_my_notifications(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's notifications"""
    
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    notifications = result.scalars().all()
    
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "related_id": str(n.related_id) if n.related_id else None
        }
        for n in notifications
    ]

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get count of unread notifications"""
    
    result = await db.execute(
        select(func.count(Notification.id))
        .where(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_read == False
            )
        )
    )
    count = result.scalar()
    
    return {"count": count}

@router.post("/{notification_id}/mark-read")
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read"""
    
    result = await db.execute(
        select(Notification).where(
            and_(
                Notification.id == notification_id,
                Notification.user_id == current_user.id
            )
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    return {"message": "Notification marked as read"}

@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    
    await db.execute(
        update(Notification)
        .where(
            and_(
                Notification.user_id == current_user.id,
                Notification.is_read == False
            )
        )
        .values(is_read=True, read_at=datetime.now(timezone.utc))
    )
    
    await db.commit()
    
    return {"message": "All notifications marked as read"}

# Notification Preferences
class PreferencesUpdate(BaseModel):
    email_on_enrollment: bool = True
    email_on_completion: bool = True
    email_on_reminder: bool = True
    inapp_on_enrollment: bool = True
    inapp_on_completion: bool = True
    inapp_on_reminder: bool = True

@router.get("/preferences")
async def get_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification preferences"""
    
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    )
    prefs = result.scalar_one_or_none()
    
    if not prefs:
        # Return defaults
        return {
            "email_on_enrollment": True,
            "email_on_completion": True,
            "email_on_reminder": True,
            "inapp_on_enrollment": True,
            "inapp_on_completion": True,
            "inapp_on_reminder": True
        }
    
    return {
        "email_on_enrollment": prefs.email_on_enrollment,
        "email_on_completion": prefs.email_on_completion,
        "email_on_reminder": prefs.email_on_reminder,
        "inapp_on_enrollment": prefs.inapp_on_enrollment,
        "inapp_on_completion": prefs.inapp_on_completion,
        "inapp_on_reminder": prefs.inapp_on_reminder
    }

@router.put("/preferences")
async def update_preferences(
    payload: PreferencesUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update notification preferences"""
    
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    )
    prefs = result.scalar_one_or_none()
    
    if not prefs:
        # Create new
        prefs = NotificationPreference(
            user_id=current_user.id,
            email_on_enrollment=payload.email_on_enrollment,
            email_on_completion=payload.email_on_completion,
            email_on_reminder=payload.email_on_reminder,
            inapp_on_enrollment=payload.inapp_on_enrollment,
            inapp_on_completion=payload.inapp_on_completion,
            inapp_on_reminder=payload.inapp_on_reminder
        )
        db.add(prefs)
    else:
        # Update existing
        prefs.email_on_enrollment = payload.email_on_enrollment
        prefs.email_on_completion = payload.email_on_completion
        prefs.email_on_reminder = payload.email_on_reminder
        prefs.inapp_on_enrollment = payload.inapp_on_enrollment
        prefs.inapp_on_completion = payload.inapp_on_completion
        prefs.inapp_on_reminder = payload.inapp_on_reminder
    
    await db.commit()
    
    return {"message": "Preferences updated"}
