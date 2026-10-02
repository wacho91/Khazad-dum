from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from src.database import get_db
from src.models.work_order import WorkOrder
from src.models.enums import WorkOrderStatus, PriorityLevel, WorkOrderType

router = APIRouter(prefix="/tenants/{tenant_id}/work-orders", tags=["work_orders"])

# === ESQUEMAS TEMPORALES (Pydantic) ===
class WorkOrderCreate(BaseModel):
    asset_id: uuid.UUID
    assigned_to: Optional[uuid.UUID] = None
    description: str
    priority: str = PriorityLevel.MEDIUM.value
    type: str = WorkOrderType.CORRECTIVE.value

class WorkOrderRead(WorkOrderCreate):
    id: uuid.UUID
    tenant_id: uuid.UUID
    status: str
    created_at: datetime
    closed_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# === ENDPOINTS ===
@router.get("", response_model=list[WorkOrderRead])
async def list_work_orders(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(WorkOrder).where(WorkOrder.tenant_id == tenant_id).order_by(WorkOrder.created_at.desc())
    )
    return result.scalars().all()

@router.post("", response_model=WorkOrderRead, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    tenant_id: uuid.UUID,
    payload: WorkOrderCreate,
    db: AsyncSession = Depends(get_db)
):
    nueva_ot = WorkOrder(
        tenant_id=tenant_id,
        asset_id=payload.asset_id,
        assigned_to=payload.assigned_to,
        description=payload.description,
        priority=payload.priority,
        type=payload.type,
        status=WorkOrderStatus.OPEN.value
    )
    db.add(nueva_ot)
    await db.commit()
    await db.refresh(nueva_ot)
    return nueva_ot