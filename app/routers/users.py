import os
import uuid
import asyncio
from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserProfileUpdate
from app.utils.dependencies import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])

PROFILE_PICTURE_DIR = Path("uploads") / "profile_pictures"
MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    profile: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if profile.username is not None:
        result = await db.execute(
            select(User).where(
                User.username == profile.username,
                User.id != current_user.id,
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Username already taken",
            )

        current_user.username = profile.username

    if profile.email is not None:
        result = await db.execute(
            select(User).where(
                User.email == profile.email,
                User.id != current_user.id,
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        current_user.email = profile.email

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.post("/me/profile-picture", response_model=UserResponse)
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    content_type = (file.content_type or "").lower()

    if content_type not in ALLOWED_TYPES:
        await file.close()
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed",
        )

    extension = ALLOWED_TYPES[content_type]
    image_data = await file.read(MAX_FILE_SIZE + 1)
    await file.close()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded image is empty",
        )

    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Image must be 5 MB or smaller",
        )

    # Check the actual file signature instead of trusting
    # the browser's content-type header alone.
    valid_signatures = {
        ".jpg": image_data.startswith(b"\xff\xd8\xff"),
        ".png": image_data.startswith(b"\x89PNG\r\n\x1a\n"),
        ".webp": (
            len(image_data) >= 12
            and image_data[:4] == b"RIFF"
            and image_data[8:12] == b"WEBP"
        ),
    }

    if not valid_signatures[extension]:
        raise HTTPException(
            status_code=400,
            detail="The file contents do not match the image type",
        )

    PROFILE_PICTURE_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    destination = PROFILE_PICTURE_DIR / filename

    # Write the new image before changing the database record.
    try:
        await __import__("asyncio").to_thread(
            destination.write_bytes,
            image_data,
        )

        old_picture = current_user.profile_picture
        current_user.profile_picture = (
            f"/uploads/profile_pictures/{filename}"
        )

        await db.commit()
        await db.refresh(current_user)

    except Exception:
        await db.rollback()
        destination.unlink(missing_ok=True)
        raise

    # Remove the previous picture only if it belongs to this
    # application's profile-picture directory.
    if old_picture:
        old_path = Path(old_picture.lstrip("/"))

        if (
            old_path.parent == PROFILE_PICTURE_DIR
            and old_path.name != filename
        ):
            try:
                old_path.unlink(missing_ok=True)
            except OSError:
                pass

    return current_user


@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1, max_length=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    search_term = q.strip()

    if not search_term:
        return []

    result = await db.execute(
        select(User.id, User.username, User.profile_picture)
        .where(
            User.id != current_user.id,
            User.username.ilike(f"%{search_term}%"),
        )
        .order_by(User.username)
        .limit(20)
    )

    return [
        {
            "id": user_id,
            "username": username,
            "profile_picture": profile_picture,
        }
        for user_id, username, profile_picture in result.all()
    ]


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
        "profile_picture": user.profile_picture,
    }