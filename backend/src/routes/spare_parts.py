"""Endpoints de SparePart y StockMovement."""

from __future__ import annotations

import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import SparePart, StockMovement
from src.models.enums import MovementType
from src.schemas.common import PaginatedResponse
from src.schemas.spare_part import (
    SparePartCreate,
    SparePartRead,
    SparePartUpdate,
    StockMovementCreate,
    StockMovementRead,
)

router = APIRouter(prefix="/tenants/{tenant_id}/spare-parts", tags=["spare-parts"])


@router.post("", response_model=SparePartRead, status_code=status.HTTP_201_CREATED)
async def create_spare_part(
    tenant_id: uuid.UUID,
    payload: SparePartCreate,
    db: AsyncSession = Depends(get_db),
) -> SparePart:
    data = payload.model_dump(by_alias=True)
    part = SparePart(tenant_id=tenant_id, **data)
    db.add(part)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="sku already exists for this tenant",
        ) from exc
    await db.refresh(part)
    return part


@router.get("", response_model=PaginatedResponse[SparePartRead])
async def list_spare_parts(
    tenant_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[SparePartRead]:
    base = select(SparePart).where(SparePart.tenant_id == tenant_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await db.execute(
        base.order_by(SparePart.sku)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [SparePartRead.model_validate(p) for p in result.scalars().all()]
    return PaginatedResponse[SparePartRead](
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{part_id}", response_model=SparePartRead)
async def get_spare_part(
    tenant_id: uuid.UUID, part_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> SparePart:
    part = await db.get(SparePart, part_id)
    if part is None or part.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="spare part not found"
        )
    return part


@router.patch("/{part_id}", response_model=SparePartRead)
async def update_spare_part(
    tenant_id: uuid.UUID,
    part_id: uuid.UUID,
    payload: SparePartUpdate,
    db: AsyncSession = Depends(get_db),
) -> SparePart:
    part = await db.get(SparePart, part_id)
    if part is None or part.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="spare part not found"
        )
    for field, value in payload.model_dump(exclude_unset=True, by_alias=True).items():
        setattr(part, field, value)
    await db.commit()
    await db.refresh(part)
    return part


@router.delete("/{part_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spare_part(
    tenant_id: uuid.UUID, part_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> None:
    part = await db.get(SparePart, part_id)
    if part is None or part.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="spare part not found"
        )
    await db.delete(part)
    await db.commit()


@router.post(
    "/{part_id}/movements",
    response_model=StockMovementRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_stock_movement(
    tenant_id: uuid.UUID,
    part_id: uuid.UUID,
    payload: StockMovementCreate,
    db: AsyncSession = Depends(get_db),
) -> StockMovement:
    part = await db.get(SparePart, part_id)
    if part is None or part.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="spare part not found"
        )

    qty: Decimal = payload.quantity
    if payload.movement_type in (MovementType.OUT, MovementType.SCRAP):
        if part.current_stock < qty:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="insufficient stock",
            )
        part.current_stock = part.current_stock - qty
    elif payload.movement_type in (MovementType.IN, MovementType.RETURN):
        part.current_stock = part.current_stock + qty
    else:  # ADJUSTMENT
        part.current_stock = qty

    total_cost = (payload.unit_cost * qty).quantize(Decimal("0.01"))
    movement = StockMovement(
        tenant_id=tenant_id,
        spare_part_id=part.id,
        movement_type=payload.movement_type,
        quantity=qty,
        unit_cost=payload.unit_cost,
        total_cost=total_cost,
        work_order_id=payload.work_order_id,
        reference=payload.reference,
        notes=payload.notes,
    )
    db.add(movement)
    await db.commit()
    await db.refresh(movement)
    return movement


@router.get(
    "/{part_id}/movements",
    response_model=list[StockMovementRead],
)
async def list_stock_movements(
    tenant_id: uuid.UUID,
    part_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[StockMovement]:
    part = await db.get(SparePart, part_id)
    if part is None or part.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="spare part not found"
        )
    result = await db.execute(
        select(StockMovement)
        .where(StockMovement.spare_part_id == part_id)
        .order_by(StockMovement.created_at.desc())
    )
    return list(result.scalars().all())
