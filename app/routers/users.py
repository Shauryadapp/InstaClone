from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate
from app.utils.dependencies import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    profile: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if profile.username is not None:
        result = await db.execute(
            select(User).where(
                User.username == profile.username,
                User.id != current_user.id
            )
        )

        existing_username = result.scalar_one_or_none()

        if existing_username:
            raise HTTPException(
                status_code=400,
                detail="Username already taken"
            )

        current_user.username = profile.username

    if profile.email is not None:
        result = await db.execute(
            select(User).where(
                User.email == profile.email,
                User.id != current_user.id
            )
        )

        existing_email = result.scalar_one_or_none()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        current_user.email = profile.email

    await db.commit()
    await db.refresh(current_user)

    return current_user



# =====================================
# VIEW ANOTHER USER'S PUBLIC PROFILE
# GET /users/{user_id}
# =====================================

@router.get("/{user_id}")
async def get_public_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
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

    return {
        "id": user.id,
        "username": user.username,
    }
