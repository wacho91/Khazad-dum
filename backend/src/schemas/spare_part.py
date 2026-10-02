from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import Field
from src.schemas.common import ORMModel

class SparePartBase(ORMModel):
    sku: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    category: str | None = None
    manufacturer: str | None = None
    part_number: str | None = None
    unit: str = "UND"
    stock_actual: Decimal = Decimal("0")
    stock_minimo: Decimal = Decimal("0")
    unit_cost: Decimal = Decimal("0")
    costo_promedio: Decimal = Decimal("0")

class SparePartCreate(SparePartBase):
    pass

class SparePartUpdate(ORMModel):
    sku: str | None = None
    name: str | None = None
    description: str | None = None
    category: str | None = None
    manufacturer: str | None = None
    part_number: str | None = None
    unit: str | None = None
    stock_actual: Decimal | None = None
    stock_minimo: Decimal | None = None
    unit_cost: Decimal | None = None
    costo_promedio: Decimal | None = None

class SparePartRead(SparePartBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    # === ESQUEMAS PARA LOS MOVIMIENTOS DE INVENTARIO (KARDEX) ===
class StockMovementBase(ORMModel):
    spare_part_id: uuid.UUID
    work_order_id: uuid.UUID | None = None
    movement_type: str
    quantity: Decimal

class StockMovementCreate(StockMovementBase):
    pass

class StockMovementRead(StockMovementBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    class Config:
        from_attributes = True