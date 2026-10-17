
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.message import MessageCreate
from app.utils.dependencies import get_current_user


router = APIRouter(prefix="/dm", tags=["Direct Messages"])


async def get_conversation_for_user(
    conversation_id: int,
    user_id: int,
    db: AsyncSession,
):
    result = await db.execute(
        select(Conversation).where(
            Conversation.id == conversation_id,
            or_(
                Conversation.participant_one_id == user_id,
                Conversation.participant_two_id == user_id,
            ),
        )
    )

    conversation = result.scalar_one_or_none()

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    return conversation


# 1. Start a conversation or return an existing one
@router.post("/conversations/{other_user_id}")
async def start_conversation(
    other_user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if other_user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot start a conversation with yourself",
        )

    user_result = await db.execute(
        select(User).where(User.id == other_user_id)
    )
    other_user = user_result.scalar_one_or_none()

    if other_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    participant_one_id = min(current_user.id, other_user_id)
    participant_two_id = max(current_user.id, other_user_id)

    result = await db.execute(
        select(Conversation).where(
            Conversation.participant_one_id == participant_one_id,
            Conversation.participant_two_id == participant_two_id,
        )
    )

    conversation = result.scalar_one_or_none()

    if conversation is None:
        conversation = Conversation(
            participant_one_id=participant_one_id,
            participant_two_id=participant_two_id,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    return {
        "id": conversation.id,
        "participant_one_id": conversation.participant_one_id,
        "participant_two_id": conversation.participant_two_id,
        "created_at": conversation.created_at,
    }


# 2. List conversations belonging to the logged-in user
@router.get("/conversations")
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation)
        .where(
            or_(
                Conversation.participant_one_id == current_user.id,
                Conversation.participant_two_id == current_user.id,
            )
        )
        .order_by(Conversation.updated_at.desc())
    )

    conversations = result.scalars().all()
    response = []

    for conversation in conversations:
        other_user_id = (
            conversation.participant_two_id
            if conversation.participant_one_id == current_user.id
            else conversation.participant_one_id
        )

        user_result = await db.execute(
            select(User).where(User.id == other_user_id)
        )
        other_user = user_result.scalar_one_or_none()

        message_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.desc(), Message.id.desc())
            .limit(1)
        )
        latest_message = message_result.scalar_one_or_none()

        response.append({
            "id": conversation.id,
            "other_user": {
                "id": other_user.id,
                "username": other_user.username,
                "profile_picture": other_user.profile_picture,
            } if other_user else None,
            "latest_message": {
                "id": latest_message.id,
                "sender_id": latest_message.sender_id,
                "content": latest_message.content,
                "created_at": latest_message.created_at,
                "is_read": latest_message.is_read,
            } if latest_message else None,
            "updated_at": conversation.updated_at,
        })

    return response


# 3. Send a message
@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    conversation = await get_conversation_for_user(
        conversation_id,
        current_user.id,
        db,
    )

    content = payload.content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty",
        )

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=content,
    )

    conversation.updated_at = datetime.utcnow()

    db.add(message)
    await db.commit()
    await db.refresh(message)

    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "sender_username": current_user.username,
        "sender_profile_picture": current_user.profile_picture,
        "content": message.content,
        "is_read": message.is_read,
        "created_at": message.created_at,
    }


# 4. Get message history
@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_conversation_for_user(
        conversation_id,
        current_user.id,
        db,
    )

    result = await db.execute(
        select(Message, User.username, User.profile_picture)
        .join(User, Message.sender_id == User.id)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )

    rows = result.all()

    return [
    {
        "id": row[0].id,
        "conversation_id": row[0].conversation_id,
        "sender_id": row[0].sender_id,
        "sender_username": row[1],
        "sender_profile_picture": row[2],
        "content": row[0].content,
        "is_read": row[0].is_read,
        "created_at": row[0].created_at,
    }
    for row in rows
]