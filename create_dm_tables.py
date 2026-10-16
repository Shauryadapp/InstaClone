
import asyncio

from app.database import engine, Base

# Import models so SQLAlchemy registers their tables
from app.models.user import User
from app.models.post import Post, Like, Comment
from app.models.notifications import Notification
from app.models.conversation import Conversation
from app.models.message import Message


async def main():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    print("Direct Messages tables created successfully!")


if __name__ == "__main__":
    asyncio.run(main())
