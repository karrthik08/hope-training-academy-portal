from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification, NotificationPreference
from app.models.user import User
import uuid

async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str,
    related_id: uuid.UUID = None
):
    """Create an in-app notification"""
    
    # Check user preferences
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == user_id
        )
    )
    prefs = result.scalar_one_or_none()
    
    # Check if user wants this type of notification
    if prefs:
        if notification_type == "enrollment" and not prefs.inapp_on_enrollment:
            return None
        if notification_type == "completion" and not prefs.inapp_on_completion:
            return None
        if notification_type == "reminder" and not prefs.inapp_on_reminder:
            return None
    
    # Create notification
    notification = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
        related_id=related_id
    )
    
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    return notification

async def notify_enrollment(
    db: AsyncSession,
    user_id: uuid.UUID,
    training_title: str,
    enrollment_id: uuid.UUID
):
    """Notify user of new enrollment"""
    
    return await create_notification(
        db=db,
        user_id=user_id,
        title="New Training Enrollment",
        message=f"You have been enrolled in '{training_title}'",
        notification_type="enrollment",
        related_id=enrollment_id
    )

async def notify_completion(
    db: AsyncSession,
    user_id: uuid.UUID,
    training_title: str,
    enrollment_id: uuid.UUID
):
    """Notify user of training completion"""
    
    return await create_notification(
        db=db,
        user_id=user_id,
        title="Training Completed! 🎉",
        message=f"Congratulations! You've completed '{training_title}'. Your certificate is ready!",
        notification_type="completion",
        related_id=enrollment_id
    )
