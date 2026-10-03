from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from decimal import Decimal
import uuid

from src.database import get_db
from src.models.work_order import WorkOrder
from src.models.enums import WorkOrderStatus, PriorityLevel, WorkOrderType
from src.models.spare_part import SparePart, StockMovement
from src.models.asset import Asset

router = APIRouter(prefix="/tenants/{tenant_id}/work-orders", tags=["work_orders"])

# === ESQUEMAS (Pydantic) ===
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

# === ESQUEMAS PARA EL CIERRE DE OT ===
class UsedPart(BaseModel):
    spare_part_id: uuid.UUID
    quantity: Decimal

class CloseWorkOrder(BaseModel):
    used_parts: list[UsedPart] = []
    labor_cost: Decimal = Decimal("0")

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

# === MOTOR DE COSTOS: CERRAR OT Y DESCONTAR REPUESTOS ===
@router.post("/{wo_id}/close", response_model=WorkOrderRead)
async def close_work_order(
    tenant_id: uuid.UUID,
    wo_id: uuid.UUID,
    payload: CloseWorkOrder,
    db: AsyncSession = Depends(get_db)
):
    # 1. Buscamos la OT
    wo = await db.get(WorkOrder, wo_id)
    if not wo or wo.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="Orden de trabajo no encontrada")
    
    if wo.status == "completed":
        raise HTTPException(status_code=400, detail="Esta OT ya está cerrada.")

    # 2. Buscamos la máquina para sumarle el costo
    asset = await db.get(Asset, wo.asset_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Activo no encontrado")

    total_cost = Decimal("0")

    # 3. Recorremos los repuestos usados para descontarlos y calcular el costo
    for part_data in payload.used_parts:
        part = await db.get(SparePart, part_data.spare_part_id)
        if not part:
            raise HTTPException(status_code=404, detail=f"Repuesto {part_data.spare_part_id} no encontrado")
        
        if part.stock_actual < part_data.quantity:
            raise HTTPException(status_code=400, detail=f"Stock insuficiente para {part.name}. Solo hay {part.stock_actual}")
        
        # Descontamos de la bodega (Forzamos Decimal)
        part.stock_actual = Decimal(str(part.stock_actual)) - Decimal(str(part_data.quantity))
        
        # Calculamos el costo de este repuesto (Forzamos todo a Decimal para evitar None)
        u_cost = Decimal(str(part.unit_cost)) if part.unit_cost is not None else Decimal("0")
        p_cost = Decimal(str(part.costo_promedio)) if part.costo_promedio is not None else Decimal("0")
        
        # Magia: Si tiene unit_cost lo usa, si no, usa costo_promedio
        part_price = u_cost if u_cost > 0 else p_cost
        part_cost = Decimal(str(part_data.quantity)) * part_price
        total_cost += part_cost

        # Registramos el movimiento en el Kardex (Historial)
        movement = StockMovement(
            tenant_id=tenant_id,
            spare_part_id=part.id,
            work_order_id=wo.id,
            movement_type="out", # Salida
            quantity=part_data.quantity
        )
        db.add(movement)

    # 4. Sumamos la mano de obra
    total_cost += payload.labor_cost

    # 5. Actualizamos la Máquina (Le sumamos el costo total a su TCO)
    asset.costo_acumulado = (asset.costo_acumulado or Decimal("0")) + total_cost

    # === MAGIA: Guardamos el recibo en la OT ===
    wo.labor_cost = payload.labor_cost
    wo.parts_cost = total_cost - payload.labor_cost
    # ===========================================

    # 6. Cerramos la OT
    wo.status = "completed"
    wo.closed_at = datetime.now()

    await db.commit()
    await db.refresh(wo)
    return wo

# === ENDPOINT: HISTORIAL DE COSTOS DE UNA MÁQUINA (Agrupado) ===
@router.get("/{wo_id}/cost-breakdown", response_model=dict)
async def get_cost_breakdown(
    tenant_id: uuid.UUID,
    wo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    wo = await db.get(WorkOrder, wo_id)
    if not wo or wo.tenant_id != tenant_id:
        raise HTTPException(status_code=404, detail="OT no encontrada")

    # Buscamos los movimientos de inventario (Kardex) y los AGRUPAMOS por repuesto
    result = await db.execute(
        select(
            StockMovement.spare_part_id,
            func.sum(StockMovement.quantity).label("total_qty")
        ).where(StockMovement.work_order_id == wo_id)
        .group_by(StockMovement.spare_part_id)
    )
    grouped_movements = result.all()

    items = []
    for spare_part_id, total_qty in grouped_movements:
        part = await db.get(SparePart, spare_part_id)
        if part:
            # Forzamos cálculos limpios
            price = part.unit_cost if part.unit_cost and part.unit_cost > 0 else part.costo_promedio
            price = Decimal(str(price)) if price else Decimal("0")
            qty = Decimal(str(total_qty))
            
            items.append({
                "name": part.name,
                "quantity": float(qty),
                "unit_price": float(price),
                "total": float(qty * price)
            })

    return {
        "description": wo.description,
        "labor_cost": float(wo.labor_cost or 0),
        "parts_cost": float(wo.parts_cost or 0),
        "total_cost": float(wo.labor_cost or 0) + float(wo.parts_cost or 0),
        "items": items,
        "closed_at": wo.closed_at
    }