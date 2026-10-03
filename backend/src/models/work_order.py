from __future__ import annotations
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import String, DateTime, func, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from src.database import Base
from src.models.enums import WorkOrderStatus, PriorityLevel, WorkOrderType, CostCategory

class WorkOrder(Base):
    __tablename__ = "work_orders"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=WorkOrderStatus.OPEN.value, nullable=False)
    priority: Mapped[str] = mapped_column(String(50), default=PriorityLevel.MEDIUM.value, nullable=False)
    type: Mapped[str] = mapped_column(String(50), default=WorkOrderType.CORRECTIVE.value, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # === NUEVAS COLUMNAS PARA EL RECIBO ===
    labor_cost: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0"), nullable=False)
    parts_cost: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0"), nullable=False)
    # ======================================

class CostEntry(Base):
    __tablename__ = "cost_entries"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    asset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    work_order_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("work_orders.id"), nullable=True)
    category: Mapped[str] = mapped_column(String(50), default=CostCategory.OTHERS.value, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), default=Decimal("0"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)