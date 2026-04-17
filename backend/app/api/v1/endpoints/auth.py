from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
import secrets
from datetime import datetime, timezone, timedelta
from app.db.session import get_db
from app.models.user import User, Role, UserRole
from app.models import training as _training_models  # noqa
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token
from app.api.v1.deps import get_current_user
from app.services.email_service import notify_new_registration


router = APIRouter(prefix="/auth", tags=["auth"])

_reset_tokens: dict = {}

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()
    role_res = await db.execute(select(Role).where(Role.name == "Participant"))
    role = role_res.scalar_one_or_none()
    if role:
        db.add(UserRole(user_id=user.id, role_id=role.id))
    await db.commit()
    
    # Send notification email
    await notify_new_registration(
        user_email=user.email,
        user_name=user.full_name,
        role="Participant"
    )
    
    result = await db.execute(
        select(User).options(selectinload(User.user_roles).selectinload(UserRole.role))
        .where(User.id == user.id)
    )
    user = result.scalar_one()
    roles = [ur.role.name for ur in user.user_roles]
    token = create_access_token(str(user.id), roles)
    return TokenResponse(access_token=token, user_id=str(user.id), full_name=user.full_name, roles=roles)
    
@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).options(selectinload(User.user_roles).selectinload(UserRole.role))
        .where(User.email == payload.email)
    )
    user = result.scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account inactive")
    roles = [ur.role.name for ur in user.user_roles]
    token = create_access_token(str(user.id), roles)
    return TokenResponse(access_token=token, user_id=str(user.id), full_name=user.full_name, roles=roles)

@router.post("/forgot-password")
async def forgot_password(payload: dict, db: AsyncSession = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user:
        token = secrets.token_urlsafe(32)
        _reset_tokens[token] = {
            "user_id": str(user.id),
            "expires": datetime.now(timezone.utc) + timedelta(hours=1)
        }
        print(f"[DEV] Password reset token for {email}: {token}")
        return {"message": "If that email exists, a reset link has been sent.", "dev_token": token}
    return {"message": "If that email exists, a reset link has been sent."}

@router.post("/reset-password")
async def reset_password(payload: dict, db: AsyncSession = Depends(get_db)):
    token = payload.get("token", "")
    new_password = payload.get("new_password", "")
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password are required.")
    entry = _reset_tokens.get(token)
    if not entry:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    if datetime.now(timezone.utc) > entry["expires"]:
        del _reset_tokens[token]
        raise HTTPException(status_code=400, detail="Reset token has expired.")
    import uuid
    user = await db.get(User, uuid.UUID(entry["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.password_hash = hash_password(new_password)
    await db.commit()
    del _reset_tokens[token]
    return {"message": "Password reset successfully."}

@router.get("/me")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
        "status": current_user.status,
        "created_at": current_user.created_at,
    }

@router.put("/me")
async def update_profile(
    payload: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if "full_name" in payload and payload["full_name"].strip():
        current_user.full_name = payload["full_name"].strip()
    if "password" in payload and payload["password"]:
        if len(payload["password"]) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
        current_user.password_hash = hash_password(payload["password"])
    await db.commit()
    return {
        "id": str(current_user.id),
        "full_name": current_user.full_name,
        "email": current_user.email,
    }