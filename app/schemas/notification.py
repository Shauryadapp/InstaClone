
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    id: int
    recipient_id: int
    sender_id: int
    type: str
    post_id: int | None
    message: str
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
