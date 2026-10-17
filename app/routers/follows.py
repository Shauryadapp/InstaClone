
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.follow import Follow
from app.models.user import User
from app.routers.notifications import create_notification


from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/users",
    tags=["Follows"],
)


# =====================================
# HELPERS
# =====================================

async def get_user_or_404(
    user_id: int,
    db: AsyncSession,
):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


async def get_followers_count(
    user_id: int,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        select(func.count(Follow.id)).where(
            Follow.followed_id == user_id
        )
    )
    return result.scalar_one()


async def get_following_count(
    user_id: int,
    db: AsyncSession,
) -> int:
    result = await db.execute(
        select(func.count(Follow.id)).where(
            Follow.follower_id == user_id
        )
    )
    return result.scalar_one()


# =====================================
# FOLLOW A USER
# POST /users/{user_id}/follow
# =====================================

@router.post("/{user_id}/follow")
async def follow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    followed_user = await get_user_or_404(user_id, db)

    if user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot follow yourself",
        )

    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user_id,
        )
    )
    existing_follow = result.scalar_one_or_none()

    if existing_follow is None:
        new_follow = Follow(
            follower_id=current_user.id,
            followed_id=followed_user.id,
        )

        db.add(new_follow)

        await create_notification(
            db=db,
            recipient_id=followed_user.id,
            sender_id=current_user.id,
            notification_type="follow",
            message=f"{current_user.username} started following you.",
        )

        await db.commit()

    return {
        "message": "User followed successfully",
        "is_following": True,
        "followers_count": await get_followers_count(user_id, db),
    }


# =====================================
# UNFOLLOW A USER
# DELETE /users/{user_id}/follow
# =====================================

@router.delete("/{user_id}/follow")
async def unfollow_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_user_or_404(user_id, db)

    result = await db.execute(
        select(Follow).where(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user_id,
        )
    )
    existing_follow = result.scalar_one_or_none()

    if existing_follow is not None:
        await db.delete(existing_follow)
        await db.commit()

    return {
        "message": "User unfollowed successfully",
        "is_following": False,
        "followers_count": await get_followers_count(user_id, db),
    }


# =====================================
# CHECK FOLLOW STATUS
# GET /users/{user_id}/follow-status
# =====================================

@router.get("/{user_id}/follow-status")
async def get_follow_status(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_user_or_404(user_id, db)

    result = await db.execute(
        select(Follow.id).where(
            Follow.follower_id == current_user.id,
            Follow.followed_id == user_id,
        )
    )
    existing_follow_id = result.scalar_one_or_none()

    return {
        "is_following": existing_follow_id is not None,
    }


# =====================================
# GET FOLLOWER / FOLLOWING COUNTS
# GET /users/{user_id}/follow-counts
# =====================================

@router.get("/{user_id}/follow-counts")
async def get_follow_counts(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    await get_user_or_404(user_id, db)

    return {
        "followers_count": await get_followers_count(user_id, db),
        "following_count": await get_following_count(user_id, db),
    }


# =====================================
# GET A USER'S FOLLOWERS
# GET /users/{user_id}/followers
# =====================================

@router.get("/{user_id}/followers")
async def get_followers(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    await get_user_or_404(user_id, db)

    result = await db.execute(
        select(User.id, User.username, User.profile_picture)
        .join(Follow, Follow.follower_id == User.id)
        .where(Follow.followed_id == user_id)
        .order_by(Follow.created_at.desc())
    )

    return [
        {"id": user_id, "username": username, "profile_picture": profile_picture}
        for user_id, username, profile_picture in result.all()
    ]


# =====================================
# GET WHO A USER FOLLOWS
# GET /users/{user_id}/following
# =====================================

@router.get("/{user_id}/following")
async def get_following(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    await get_user_or_404(user_id, db)

    result = await db.execute(
        select(User.id, User.username, User.profile_picture)
        .join(Follow, Follow.followed_id == User.id)
        .where(Follow.follower_id == user_id)
        .order_by(Follow.created_at.desc())
    )

    return [
        {"id": followed_user_id, "username": username, "profile_picture": profile_picture}
        for followed_user_id, username, profile_picture in result.all()
    ]