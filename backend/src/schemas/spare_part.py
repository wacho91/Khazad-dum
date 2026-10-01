"""Schemas de SparePart y StockMovement."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import Field

from src.models.enums import MovementType
from src.schemas.common import ORMModel


class SparePartBase(ORMModel):
    sku: str = Field(..., min_length=1, max_length=80)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    unit: str = Field("UNIT", max_length=20)
    unit_cost: Decimal = Field(Decimal("0"), ge=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    minimum_stock: Decimal = Field(Decimal("0"), ge=0)
    maximum_stock: Decimal | None = Field(None, ge=0)
    reorder_point: Decimal | None = Field(None, ge=0)
    lead_time_days: int | None = Field(None, ge=0)
    supplier_name: str | None = Field(None, max_length=200)
    supplier_ref: str | None = Field(None, max_length=150)
    is_active: bool = True
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class SparePartCreate(SparePartBase):
    current_stock: Decimal = Field(Decimal("0"), ge=0)
    model_config = {"populate_by_name": True, "from_attributes": True}


class SparePartUpdate(ORMModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    unit: str | None = Field(None, max_length=20)
    unit_cost: Decimal | None = Field(None, ge=0)
    currency: str | None = Field(None, min_length=3, max_length=3)
    minimum_stock: Decimal | None = Field(None, ge=0)
    maximum_stock: Decimal | None = Field(None, ge=0)
    reorder_point: Decimal | None = Field(None, ge=0)
    lead_time_days: int | None = Field(None, ge=0)
    supplier_name: str | None = Field(None, max_length=200)
    supplier_ref: str | None = Field(None, max_length=150)
    is_active: bool | None = None
    metadata_: dict[str, Any] | None = Field(None, alias="metadata")


class SparePartRead(SparePartBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    current_stock: Decimal
    created_at: datetime
    updated_at: datetime


class StockMovementCreate(ORMModel):
    spare_part_id: uuid.UUID
    movement_type: MovementType
    quantity: Decimal = Field(..., gt=0)
    unit_cost: Decimal = Field(Decimal("0"), ge=0)
    work_order_id: uuid.UUID | None = None
    reference: str | None = Field(None, max_length=150)
    notes: str | None = None


class StockMovementRead(ORMModel):
    id: int
    tenant_id: uuid.UUID
    spare_part_id: uuid.UUID
    movement_type: MovementType
    quantity: Decimal
    unit_cost: Decimal
    total_cost: Decimal
    work_order_id: uuid.UUID | None
    performed_by: uuid.UUID | None
    reference: str | None
    notes: str | None
    created_at: datetime
