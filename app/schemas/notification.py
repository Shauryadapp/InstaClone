
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    sender_id: int
    sender_username: str | None = None
    sender_profile_picture: str | None = None
    type: str
    post_id: int | None = None
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
