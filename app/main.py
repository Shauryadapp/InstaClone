from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, engine
from app.models.user import User
from app.models.post import Post
from app.models.follow import Follow
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.posts import router as posts_router
from app.routers import follows


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield


app = FastAPI(
    title="Instagram Clone API",
    lifespan=lifespan,
)

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(posts_router)
app.include_router(follows.router)


@app.get("/")
async def home():
    return {"message": "Instagram Clone API is running!"}













@app.get("/shaurya_rand_ka_pilla")
async def shaurya_rand_ka_pilla():
    return {"message": "Shaurya Rand Ka Pilla is running!"}