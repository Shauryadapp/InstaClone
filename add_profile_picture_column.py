import asyncio

from sqlalchemy import inspect, text

from app.database import engine


async def main():
    async with engine.begin() as connection:
        def update_table(sync_connection):
            inspector = inspect(sync_connection)

            columns = [
                column["name"]
                for column in inspector.get_columns("users")
            ]

            if "profile_picture" in columns:
                print("profile_picture column already exists.")
                return

            sync_connection.execute(
                text(
                    "ALTER TABLE users "
                    "ADD COLUMN profile_picture VARCHAR(255)"
                )
            )

            print("profile_picture column added successfully.")

        await connection.run_sync(update_table)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())