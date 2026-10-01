"""Router raíz — agrega todos los sub-routers bajo /api/v1."""

from fastapi import APIRouter

from src.routes import (
    assets,
    cost_entries,
    health,
    locations,
    spare_parts,
    tenants,
    users,
    work_orders,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(health.router)
api_router.include_router(tenants.router)
api_router.include_router(users.router)
api_router.include_router(locations.router)
api_router.include_router(assets.router)
api_router.include_router(spare_parts.router)
api_router.include_router(work_orders.router)
api_router.include_router(cost_entries.router)

__all__ = ["api_router"]
