from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.notifications import Notification
from app.schemas.notification import NotificationResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])



@router.get("/", response_model=list[NotificationResponse])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(
            Notification,
            User.username,
            User.profile_picture,
        )
        .join(User, Notification.sender_id == User.id)
        .where(Notification.recipient_id == current_user.id)
        .order_by(Notification.created_at.desc())
    )

    rows = result.all()

    return [
        {
            "id": notification.id,
            "recipient_id": notification.recipient_id,
            "sender_id": notification.sender_id,
            "sender_username": username,
            "sender_profile_picture": profile_picture,
            "type": notification.type,
            "post_id": notification.post_id,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
        }
        for notification, username, profile_picture in rows
    ]



@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from sqlalchemy import func

    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.recipient_id == current_user.id,
            Notification.is_read.is_(False),
        )
    )
    return {"unread_count": result.scalar_one()}


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.recipient_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()

    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    await db.commit()

    return {"message": "Notification marked as read"}


@router.patch("/read-all")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(
            Notification.recipient_id == current_user.id,
            Notification.is_read.is_(False),
        )
        .values(is_read=True)
    )
    await db.commit()

    return {"message": "All notifications marked as read"}



async def create_notification(
    db: AsyncSession,
    recipient_id: int,
    sender_id: int,
    notification_type: str,
    message: str,
    post_id: int | None = None,
):
    if recipient_id == sender_id:
        return

    notification = Notification(
        recipient_id=recipient_id,
        sender_id=sender_id,
        type=notification_type,
        message=message,
        post_id=post_id,
    )

    db.add(notification)