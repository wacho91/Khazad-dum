"""Schemas de Tenant."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import Field

from src.models.enums import TenantPlan
from src.schemas.common import ORMModel


class TenantBase(ORMModel):
    slug: str = Field(..., min_length=3, max_length=64, pattern=r"^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$")
    name: str = Field(..., min_length=1, max_length=200)
    plan: TenantPlan = TenantPlan.FREE
    is_active: bool = True
    settings: dict[str, Any] = Field(default_factory=dict)


class TenantCreate(TenantBase):
    pass


class TenantUpdate(ORMModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    plan: TenantPlan | None = None
    is_active: bool | None = None
    settings: dict[str, Any] | None = None


class TenantRead(TenantBase):
    id: uuid.UUID
    plan: str | None = None  # O TenantPlan, dependiendo de cómo lo tengas
    created_at: datetime
    updated_at: datetime | None = None  # <--- ASEGÚRATE DE QUE SEA OPCIONAL
    
    class Config:
        from_attributes = True
