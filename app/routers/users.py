from fastapi import APIRouter, Depends
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
        current_user.username = profile.username

    if profile.email is not None:
        current_user.email = profile.email

    await db.commit()
    await db.refresh(current_user)

    return current_user