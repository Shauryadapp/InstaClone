
import os

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase


# Render will provide DATABASE_URL.
# Local development will continue using SQLite.
database_url = os.getenv("DATABASE_URL")

if database_url:
    # Convert Render's PostgreSQL URL into SQLAlchemy's
    # asyncpg-compatible URL format.
    if database_url.startswith("postgres://"):
        database_url = database_url.replace(
            "postgres://",
            "postgresql+asyncpg://",
            1,
        )
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace(
            "postgresql://",
            "postgresql+asyncpg://",
            1,
        )

    DATABASE_URL = database_url

else:
    if os.getenv("APP_ENV") == "production":
        raise RuntimeError(
            "DATABASE_URL must be configured in production."
        )

    DATABASE_URL = "sqlite+aiosqlite:///./instagram.db"


engine = create_async_engine(
    DATABASE_URL,
    echo=False,
)


async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        yield session
