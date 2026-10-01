"""Endpoints de Location."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_db
from src.models import Location
from src.schemas.common import PaginatedResponse
from src.schemas.location import LocationCreate, LocationRead, LocationUpdate

router = APIRouter(prefix="/tenants/{tenant_id}/locations", tags=["locations"])


@router.post("", response_model=LocationRead, status_code=status.HTTP_201_CREATED)
async def create_location(
    tenant_id: uuid.UUID,
    payload: LocationCreate,
    db: AsyncSession = Depends(get_db),
) -> Location:
    data = payload.model_dump(by_alias=True)
    location = Location(tenant_id=tenant_id, **data)
    db.add(location)
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="location code already exists for this tenant",
        ) from exc
    await db.refresh(location)
    return location


@router.get("", response_model=PaginatedResponse[LocationRead])
async def list_locations(
    tenant_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[LocationRead]:
    base = select(Location).where(Location.tenant_id == tenant_id)
    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    result = await db.execute(
        base.order_by(Location.code)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = [LocationRead.model_validate(loc) for loc in result.scalars().all()]
    return PaginatedResponse[LocationRead](
        items=items, total=total, page=page, page_size=page_size
    )


@router.get("/{location_id}", response_model=LocationRead)
async def get_location(
    tenant_id: uuid.UUID,
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Location:
    location = await db.get(Location, location_id)
    if location is None or location.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="location not found"
        )
    return location


@router.patch("/{location_id}", response_model=LocationRead)
async def update_location(
    tenant_id: uuid.UUID,
    location_id: uuid.UUID,
    payload: LocationUpdate,
    db: AsyncSession = Depends(get_db),
) -> Location:
    location = await db.get(Location, location_id)
    if location is None or location.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="location not found"
        )
    for field, value in payload.model_dump(exclude_unset=True, by_alias=True).items():
        setattr(location, field, value)
    await db.commit()
    await db.refresh(location)
    return location


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    tenant_id: uuid.UUID,
    location_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    location = await db.get(Location, location_id)
    if location is None or location.tenant_id != tenant_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="location not found"
        )
    await db.delete(location)
    await db.commit()
