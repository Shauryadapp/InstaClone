from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.user import UserCreate


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    return {
        "message": "Database connection received!",
        "username": user.username,
        "email": user.email
    }