from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.comment import TrainingComment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentOut
from app.api.v1.deps import get_current_user
import uuid

router = APIRouter(tags=["comments"])

@router.post("/trainings/{training_id}/comments", response_model=CommentOut)
async def create_comment(
    training_id: uuid.UUID,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new comment on a training"""
    
    comment = TrainingComment(
        training_id=training_id,
        user_id=current_user.id,
        comment_text=comment_data.comment_text
    )
    
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    
    # Add user full name to response
    result = CommentOut.model_validate(comment)
    result.user_full_name = current_user.full_name
    return result

@router.get("/trainings/{training_id}/comments", response_model=list[CommentOut])
async def get_training_comments(
    training_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get all comments for a training"""
    
    result = await db.execute(
        select(TrainingComment, User.full_name)
        .join(User, TrainingComment.user_id == User.id)
        .where(TrainingComment.training_id == training_id)
        .order_by(TrainingComment.created_at.desc())
    )
    
    comments = []
    for comment, full_name in result.all():
        comment_dict = CommentOut.model_validate(comment)
        comment_dict.user_full_name = full_name
        comments.append(comment_dict)
    
    return comments

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a comment (only if you own it or are admin)"""
    
    result = await db.execute(
        select(TrainingComment).where(TrainingComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user owns the comment or is admin
    user_roles = [ur.role.name for ur in current_user.user_roles]
    if comment.user_id != current_user.id and "admin" not in user_roles:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")
    
    await db.delete(comment)
    await db.commit()
    
    return {"message": "Comment deleted successfully"}
