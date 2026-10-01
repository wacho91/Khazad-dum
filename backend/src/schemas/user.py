"""Schemas de User."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import EmailStr, Field

from src.models.enums import UserRole
from src.schemas.common import ORMModel


class UserBase(ORMModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=200)
    role: UserRole = UserRole.VIEWER
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(ORMModel):
    full_name: str | None = Field(None, min_length=1, max_length=200)
    role: UserRole | None = None
    is_active: bool | None = None
    password: str | None = Field(None, min_length=8, max_length=128)


class UserRead(UserBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    last_login_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
