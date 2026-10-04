"""Endpoints de User."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import User
from src.schemas.common import PaginatedResponse
from src.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/tenants/{tenant_id}/users", tags=["users"])


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(
    tenant_id: uuid.UUID,
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    data = payload.model_dump(exclude={"password"})
    user = User(tenant_id=tenant_id, password_hash=payload.password, **data)
    db.add(user)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="email already registered for this tenant",
        ) from exc
    await db.refresh(user)
    return user


@router.get("", response_model=PaginatedResponse[UserRead])
async def list_users(
    tenant_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[UserRead]:
    base = select(User).where(User.tenant_id == tenant_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await db.execute(
        base.order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [UserRead.model_validate(u) for u in result.scalars().all()]
    return PaginatedResponse[UserRead](
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    tenant_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> User:
    user = await db.get(User, user_id)
    if user is None or user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: AsyncSession = Depends(get_db),
) -> User:
    user = await db.get(User, user_id)
    if user is None or user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    data = payload.model_dump(exclude_unset=True)
    if "password" in data:
        user.password_hash = data.pop("password")
    for field, value in data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}")
async def delete_user(
    tenant_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> None:
    user = await db.get(User, user_id)
    if user is None or user.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="user not found"
        )
    await db.delete(user)
    await db.commit()
    Response(status_code=status.HTTP_204_NO_CONTENT)
