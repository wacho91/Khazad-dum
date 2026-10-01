"""Schemas de Asset y AssetStatusHistory."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import Field

from src.models.enums import AssetStatus, CriticalityLevel
from src.schemas.common import ORMModel


class AssetBase(ORMModel):
    qr_code: str = Field(..., min_length=1, max_length=64)
    asset_tag: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    manufacturer: str | None = Field(None, max_length=150)
    model: str | None = Field(None, max_length=150)
    serial_number: str | None = Field(None, max_length=150)
    status: AssetStatus = AssetStatus.OPERATIONAL
    criticality: CriticalityLevel = CriticalityLevel.MEDIUM
    location_id: uuid.UUID | None = None
    purchase_date: date | None = None
    purchase_cost: Decimal | None = Field(None, ge=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    useful_life_months: int | None = Field(None, gt=0)
    warranty_until: date | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class AssetCreate(AssetBase):
    model_config = {"populate_by_name": True, "from_attributes": True}


class AssetUpdate(ORMModel):
    qr_code: str | None = Field(None, min_length=1, max_length=64)
    asset_tag: str | None = Field(None, min_length=1, max_length=100)
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    manufacturer: str | None = Field(None, max_length=150)
    model: str | None = Field(None, max_length=150)
    serial_number: str | None = Field(None, max_length=150)
    criticality: CriticalityLevel | None = None
    location_id: uuid.UUID | None = None
    purchase_date: date | None = None
    purchase_cost: Decimal | None = Field(None, ge=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    useful_life_months: int | None = Field(None, gt=0)
    warranty_until: date | None = None
    metadata_: dict[str, Any] | None = Field(None, alias="metadata")


class AssetRead(AssetBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class AssetStatusChange(ORMModel):
    to_status: AssetStatus
    reason: str | None = Field(None, max_length=1000)


class AssetStatusHistoryRead(ORMModel):
    id: int
    asset_id: uuid.UUID
    from_status: AssetStatus | None
    to_status: AssetStatus
    changed_by: uuid.UUID | None
    reason: str | None
    changed_at: datetime
