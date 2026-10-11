
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    DateTime,
    UniqueConstraint,
)

from app.database import Base


class Follow(Base):
    __tablename__ = "follows"

    __table_args__ = (
        UniqueConstraint(
            "follower_id",
            "followed_id",
            name="uq_follower_followed",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)

    follower_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    followed_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )