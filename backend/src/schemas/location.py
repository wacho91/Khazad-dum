"""Schemas de Location."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import Field

from src.schemas.common import ORMModel


class LocationBase(ORMModel):
    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=1, max_length=50)
    location_type: str = Field("AREA", max_length=50)
    parent_id: uuid.UUID | None = None
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class LocationCreate(LocationBase):
    model_config = {"populate_by_name": True, "from_attributes": True}


class LocationUpdate(ORMModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    code: str | None = Field(None, min_length=1, max_length=50)
    location_type: str | None = Field(None, max_length=50)
    parent_id: uuid.UUID | None = None
    metadata_: dict[str, Any] | None = Field(None, alias="metadata")


class LocationRead(LocationBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
