"""Schemas de WorkOrder, WorkOrderTask y WorkOrderPart."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import Field, model_validator

from src.models.enums import PriorityLevel, WorkOrderStatus, WorkOrderType
from src.schemas.common import ORMModel


class WorkOrderBase(ORMModel):
    asset_id: uuid.UUID
    code: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=250)
    description: str | None = None
    wo_type: WorkOrderType
    priority: PriorityLevel = PriorityLevel.MEDIUM
    assigned_to: uuid.UUID | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    sla_due_at: datetime | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")

    @model_validator(mode="after")
    def _validate_schedule(self) -> "WorkOrderBase":
        if (
            self.scheduled_start
            and self.scheduled_end
            and self.scheduled_end < self.scheduled_start
        ):
            raise ValueError("scheduled_end debe ser >= scheduled_start")
        return self


class WorkOrderCreate(WorkOrderBase):
    model_config = {"populate_by_name": True, "from_attributes": True}


class WorkOrderUpdate(ORMModel):
    title: str | None = Field(None, min_length=1, max_length=250)
    description: str | None = None
    priority: PriorityLevel | None = None
    status: WorkOrderStatus | None = None
    assigned_to: uuid.UUID | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    sla_due_at: datetime | None = None
    labor_hours: Decimal | None = Field(None, ge=0)
    labor_cost: Decimal | None = Field(None, ge=0)
    resolution_notes: str | None = None
    metadata_: dict[str, Any] | None = Field(None, alias="metadata")


class WorkOrderRead(WorkOrderBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    status: WorkOrderStatus
    created_by: uuid.UUID | None
    started_at: datetime | None
    completed_at: datetime | None
    sla_breached: bool
    labor_hours: Decimal
    labor_cost: Decimal
    parts_cost: Decimal
    total_cost: Decimal
    currency: str
    resolution_notes: str | None
    created_at: datetime
    updated_at: datetime


class WorkOrderTaskCreate(ORMModel):
    sequence: int = Field(1, ge=1)
    description: str = Field(..., min_length=1, max_length=500)
    notes: str | None = None


class WorkOrderTaskRead(ORMModel):
    id: uuid.UUID
    work_order_id: uuid.UUID
    sequence: int
    description: str
    is_completed: bool
    completed_at: datetime | None
    completed_by: uuid.UUID | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class WorkOrderPartCreate(ORMModel):
    spare_part_id: uuid.UUID
    quantity: Decimal = Field(..., gt=0)
    unit_cost: Decimal = Field(Decimal("0"), ge=0)


class WorkOrderPartRead(ORMModel):
    id: uuid.UUID
    work_order_id: uuid.UUID
    spare_part_id: uuid.UUID
    quantity: Decimal
    unit_cost: Decimal
    total_cost: Decimal
