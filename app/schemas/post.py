from datetime import datetime

from pydantic import BaseModel, Field


class PostResponse(BaseModel):
    id: int
    user_id: int
    username: str | None = None
    image: str
    image_url: str
    caption: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class PostUpdate(BaseModel):
    caption: str | None = None


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    username: str
    content: str
    created_at: datetime


class LikeActionResponse(BaseModel):
    message: str
    likes_count: int