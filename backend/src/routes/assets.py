"""Endpoints de Asset y AssetStatusHistory."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy import func, select
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import Asset, AssetStatusHistory
from src.schemas.asset import (
    AssetCreate,
    AssetRead,
    AssetStatusChange,
    AssetStatusHistoryRead,
    AssetUpdate,
)
from src.schemas.common import PaginatedResponse

router = APIRouter(prefix="/tenants/{tenant_id}/assets", tags=["assets"])


@router.post("", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
async def create_asset(
    tenant_id: uuid.UUID,
    payload: AssetCreate,
    db: AsyncSession = Depends(get_db),
) -> Asset:
    data = payload.model_dump(by_alias=True)
    asset = Asset(tenant_id=tenant_id, **data)
    db.add(asset)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="asset_tag or qr_code already exists for this tenant",
        ) from exc
    await db.refresh(asset)
    return asset


@router.get("", response_model=PaginatedResponse[AssetRead])
async def list_assets(
    tenant_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[AssetRead]:
    base = select(Asset).where(Asset.tenant_id == tenant_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await db.execute(
        base.order_by(Asset.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [AssetRead.model_validate(a) for a in result.scalars().all()]
    return PaginatedResponse[AssetRead](
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{asset_id}", response_model=AssetRead)
async def get_asset(
    tenant_id: uuid.UUID, asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> Asset:
    asset = await db.get(Asset, asset_id)
    if asset is None or asset.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="asset not found"
        )
    return asset


@router.patch("/{asset_id}", response_model=AssetRead)
async def update_asset(
    tenant_id: uuid.UUID,
    asset_id: uuid.UUID,
    payload: AssetUpdate,
    db: AsyncSession = Depends(get_db),
) -> Asset:
    asset = await db.get(Asset, asset_id)
    if asset is None or asset.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="asset not found"
        )
    for field, value in payload.model_dump(exclude_unset=True, by_alias=True).items():
        setattr(asset, field, value)
    await db.commit()
    await db.refresh(asset)
    return asset


@router.delete("/{asset_id}")
async def delete_asset(
    tenant_id: uuid.UUID, asset_id: uuid.UUID, db: AsyncSession = Depends(get_db)
) -> None:
    asset = await db.get(Asset, asset_id)
    if asset is None or asset.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="asset not found"
        )
    
    # === MAGIA: Borramos en orden de dependencias para no violar llaves foráneas ===
    # 1. Borramos los movimientos de inventario (Kardex) asociados a las OTs de esta máquina
    await db.execute(
        text("DELETE FROM stock_movements WHERE work_order_id IN (SELECT id FROM work_orders WHERE asset_id = :asset_id)"),
        {"asset_id": asset_id}
    )
    # 2. Borramos las OTs asociadas a esta máquina
    await db.execute(text("DELETE FROM work_orders WHERE asset_id = :asset_id"), {"asset_id": asset_id})
    # 3. Borramos el historial de estados de la máquina
    await db.execute(text("DELETE FROM asset_status_history WHERE asset_id = :asset_id"), {"asset_id": asset_id})
    # ==============================================================================
    
    await db.delete(asset)
    await db.commit()
    # Devolvemos la respuesta 204 explícitamente
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{asset_id}/status",
    response_model=AssetStatusHistoryRead,
    status_code=status.HTTP_201_CREATED,
)
async def change_asset_status(
    tenant_id: uuid.UUID,
    asset_id: uuid.UUID,
    payload: AssetStatusChange,
    db: AsyncSession = Depends(get_db),
) -> AssetStatusHistory:
    asset = await db.get(Asset, asset_id)
    if asset is None or asset.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="asset not found"
        )
    history = AssetStatusHistory(
        tenant_id=tenant_id,
        asset_id=asset.id,
        from_status=asset.status,
        to_status=payload.to_status,
        reason=payload.reason,
    )
    asset.status = payload.to_status
    db.add(history)
    await db.commit()
    await db.refresh(history)
    return history


@router.get(
    "/{asset_id}/history",
    response_model=list[AssetStatusHistoryRead],
)
async def list_asset_history(
    tenant_id: uuid.UUID,
    asset_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[AssetStatusHistory]:
    asset = await db.get(Asset, asset_id)
    if asset is None or asset.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="asset not found"
        )
    result = await db.execute(
        select(AssetStatusHistory)
        .where(AssetStatusHistory.asset_id == asset_id)
        .order_by(AssetStatusHistory.changed_at.desc())
    )
    return list(result.scalars().all())