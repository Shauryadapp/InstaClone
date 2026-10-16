import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.post import Post, Like, Comment

from app.routers.notifications import create_notification

from app.models.user import User
from app.schemas.post import PostResponse, PostUpdate, CommentCreate, CommentResponse, LikeActionResponse
from app.utils.dependencies import get_current_user


router = APIRouter(
    prefix="/posts",
    tags=["Posts"]
)


def build_image_url(request: Request, image_path: str) -> str:
    filename = Path(image_path).name
    return str(request.base_url).rstrip("/") + f"/uploads/{filename}"

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp"
}


async def count_likes(db: AsyncSession, post_id: int) -> int:
    result = await db.execute(
        select(func.count(Like.id)).where(
            Like.post_id == post_id
        )
    )
    return result.scalar_one()


@router.get("/{post_id}/like-status")
async def get_like_status(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post.id).where(Post.id == post_id)
    )

    post_exists = result.scalar_one_or_none()

    if post_exists is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    result = await db.execute(
        select(Like.id).where(
            Like.post_id == post_id,
            Like.user_id == current_user.id,
        )
    )

    like_exists = result.scalar_one_or_none()

    return {
        "liked": like_exists is not None,
        "likes_count": await count_likes(db, post_id),
    }


@router.post("/", response_model=PostResponse)
async def create_post(
    request : Request,
    image: UploadFile = File(...),
    caption: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG, PNG, and WebP images are allowed"
        )

    filename = image.filename

    if filename is None:
       raise HTTPException(
        status_code=400,
        detail="Uploaded image must have a filename",
    )

    file_extension = Path(filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    file_path = UPLOAD_DIR / unique_filename

    with file_path.open("wb") as buffer:
        buffer.write(await image.read())

    new_post = Post(
        user_id=current_user.id,
        image=str(file_path),
        caption=caption
    )

    db.add(new_post)

    await db.commit()

    await db.refresh(new_post)

    return  {
    "id": new_post.id,
    "user_id": new_post.user_id,
    "image": new_post.image,
    "image_url": build_image_url(request, new_post.image),
    "caption": new_post.caption,
    "created_at": new_post.created_at
}



@router.get("/", response_model=list[PostResponse])
async def get_posts(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Post, User.username)
        .join(User, Post.user_id == User.id)
        .order_by(Post.created_at.desc())
    )

    rows = result.all()

    return [
        {
            "id": post.id,
            "user_id": post.user_id,
            "username": username,
            "image": post.image,
            "image_url": build_image_url(request, post.image),
            "caption": post.caption,
            "created_at": post.created_at,
        }
        for post, username in rows
    ]


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )

    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found"
        )

    return {
        "id": post.id,
        "user_id": post.user_id,
        "image": post.image,
        "image_url": build_image_url(request, post.image),
        "caption": post.caption,
        "created_at": post.created_at
    }




@router.delete("/{post_id}")
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Find the post
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    # 2. Check whether the post exists
    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found",
        )

    # 3. Check post ownership
    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to delete this post",
        )

    # 4. Save the image path before deleting the database record
    image_path = Path(post.image)

    # 5. Delete related records and the post in one transaction
    try:
        await db.execute(
            delete(Like).where(Like.post_id == post_id)
        )

        await db.execute(
            delete(Comment).where(Comment.post_id == post_id)
        )

        await db.delete(post)
        await db.commit()

    except Exception:
        await db.rollback()
        raise

    # 6. Delete the image only after the database commit succeeds
    try:
        if image_path.is_file():
            image_path.unlink()

    except OSError:
        import logging

        logging.getLogger(__name__).exception(
            "Could not remove deleted post image: %s",
            image_path,
        )

    # 7. Return the success response
    return {
        "message": "Post deleted successfully"
    }


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    request : Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )

    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(
            status_code=404,
            detail="Post not found"
        )

    if post.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to edit this post"
        )

    post.caption = post_data.caption

    await db.commit()
    await db.refresh(post)

    return {
    "id": post.id,
    "user_id": post.user_id,
    "image": post.image,
    "image_url": build_image_url(request, post.image),
    "caption": post.caption,
    "created_at": post.created_at
}




# =========================
# LIKE A POST
# =========================

@router.post("/{post_id}/like", response_model=LikeActionResponse)
async def like_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    result = await db.execute(
        select(Like).where(
            Like.user_id == current_user.id,
            Like.post_id == post_id,
        )
    )
    existing_like = result.scalar_one_or_none()

    if existing_like:
        return {
            "message": "Post already liked",
            "likes_count": await count_likes(db, post_id),
        }

    new_like = Like(
        user_id=current_user.id,
        post_id=post_id,
    )

    db.add(new_like)

    await create_notification(
    db=db,
    recipient_id=post.user_id,
    sender_id=current_user.id,
    notification_type="like",
    message=f"{current_user.username} liked your post.",
    post_id=post.id,
    )

    await db.commit()

    return {
        "message": "Post liked successfully",
        "likes_count": await count_likes(db, post_id),
    }


# =========================
# UNLIKE A POST
# =========================

@router.delete("/{post_id}/like", response_model=LikeActionResponse)
async def unlike_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    result = await db.execute(
        select(Like).where(
            Like.user_id == current_user.id,
            Like.post_id == post_id,
        )
    )
    existing_like = result.scalar_one_or_none()

    if existing_like is None:
        return {
            "message": "Post was not liked",
            "likes_count": await count_likes(db, post_id),
        }

    await db.delete(existing_like)
    await db.commit()

    return {
        "message": "Post unliked successfully",
        "likes_count": await count_likes(db, post_id),
    }


# =========================
# CREATE A COMMENT
# =========================

@router.post(
    "/{post_id}/comments",
    response_model=CommentResponse,
)
async def create_comment(
    post_id: int,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    content = comment_data.content.strip()

    if not content:
        raise HTTPException(
            status_code=422,
            detail="Comment cannot be empty",
        )

    new_comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=content,
    )

    db.add(new_comment)

    await create_notification(
    db=db,
    recipient_id=post.user_id,
    sender_id=current_user.id,
    notification_type="comment",
    message=f"{current_user.username} commented on your post.",
    post_id=post.id,
)

    await db.commit()
    await db.refresh(new_comment)

    return {
        "id": new_comment.id,
        "post_id": new_comment.post_id,
        "user_id": new_comment.user_id,
        "username": current_user.username,
        "content": new_comment.content,
        "created_at": new_comment.created_at,
    }


# =========================
# GET COMMENTS FOR A POST
# =========================

@router.get(
    "/{post_id}/comments",
    response_model=list[CommentResponse],
)
async def get_comments(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Post).where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()

    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    result = await db.execute(
        select(Comment, User.username)
        .join(User, Comment.user_id == User.id)
        .where(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
    )

    rows = result.all()

    return [
        {
            "id": comment.id,
            "post_id": comment.post_id,
            "user_id": comment.user_id,
            "username": username,
            "content": comment.content,
            "created_at": comment.created_at,
        }
        for comment, username in rows
    ]


# =========================
# DELETE YOUR OWN COMMENT
# =========================

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if comment is None:
        raise HTTPException(
            status_code=404,
            detail="Comment not found",
        )

    ownership_result = await db.execute(
    select(Comment.id).where(
        Comment.id == comment_id,
        Comment.user_id == current_user.id,
    )
)

    owns_comment = ownership_result.scalar_one_or_none()

    if owns_comment is None:
       raise HTTPException(
        status_code=403,
        detail="You can only delete your own comments",
    )

    await db.delete(comment)
    await db.commit()

    return {"message": "Comment deleted successfully"}