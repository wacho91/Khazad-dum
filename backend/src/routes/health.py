"""Endpoints de healthcheck."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from src.database import ping
from src.schemas.common import MessageResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=MessageResponse)
async def health() -> MessageResponse:
    return MessageResponse(detail="ok")


@router.get("/health/db", response_model=MessageResponse)
async def health_db() -> MessageResponse:
    try:
        ok = await ping()
    except Exception as exc:  # pragma: no cover
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"database unavailable: {exc}",
        ) from exc
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database ping failed",
        )
    return MessageResponse(detail="db ok")
