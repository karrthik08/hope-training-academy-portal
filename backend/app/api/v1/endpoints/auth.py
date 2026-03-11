from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import get_db
from app.models.user import User, Role, UserRole
from app.models import training as _training_models  # noqa - ensures models are loaded
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

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
    # Re-fetch user with roles eagerly loaded
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
    # Fetch user with roles eagerly loaded
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