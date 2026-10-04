from fastapi import APIRouter


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register")
async def register():
    return {"message": "Registration endpoint works!"}