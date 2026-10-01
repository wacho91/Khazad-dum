from fastapi import APIRouter

# Usamos importaciones relativas (con el puntito) para evitar el circular import
from .assets import router as assets_router
from .cost_entries import router as cost_entries_router
from .locations import router as locations_router
from .spare_parts import router as spare_parts_router
from .tenants import router as tenants_router
from .users import router as users_router
from .work_orders import router as work_orders_router

api_router = APIRouter()

# Incluimos todas las rutas en el router principal
api_router.include_router(assets_router)
api_router.include_router(cost_entries_router)
api_router.include_router(locations_router)
api_router.include_router(spare_parts_router)
api_router.include_router(tenants_router)
api_router.include_router(users_router)
api_router.include_router(work_orders_router)