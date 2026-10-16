
import asyncio

from app.database import engine, Base
from app.models.notifications import Notification  # noqa: F401

# Import existing models so their tables and foreign keys are registered.
from app.models.user import User  # noqa: F401
from app.models.post import Post  # noqa: F401


async def main():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)

    print("Notifications table created successfully.")


asyncio.run(main())
