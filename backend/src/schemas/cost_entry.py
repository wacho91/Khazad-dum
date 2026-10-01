"""Schemas de CostEntry."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import Field

from src.models.enums import CostCategory
from src.schemas.common import ORMModel


class CostEntryCreate(ORMModel):
    work_order_id: uuid.UUID | None = None
    asset_id: uuid.UUID | None = None
    category: CostCategory
    amount: Decimal = Field(..., ge=0)
    currency: str = Field("USD", min_length=3, max_length=3)
    incurred_on: date
    description: str | None = Field(None, max_length=500)


class CostEntryRead(ORMModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    work_order_id: uuid.UUID | None
    asset_id: uuid.UUID | None
    category: CostCategory
    amount: Decimal
    currency: str
    incurred_on: date
    description: str | None
    created_at: datetime
