from fastapi import APIRouter
from app.schemas.user import UserCreate


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
async def register(user: UserCreate):
    return {
        "message": "Registration data received!",
        "username": user.username,
        "email": user.email
    }