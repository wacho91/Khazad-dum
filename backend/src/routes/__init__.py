from fastapi import APIRouter

api_router = APIRouter()

# === IMPORTACIONES DIRECTAS (Para ver errores reales) ===
from .assets import router as assets_router
api_router.include_router(assets_router)

from .spare_parts import router as spare_parts_router
api_router.include_router(spare_parts_router)

from .tenants import router as tenants_router
api_router.include_router(tenants_router)

from .users import router as users_router
api_router.include_router(users_router)

from .auth import router as auth_router
api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])

# Si tienes work_orders o locations, agrégalos aquí directo también
try:
    from .work_orders import router as work_orders_router
    api_router.include_router(work_orders_router)
except ImportError:
    pass

try:
    from .locations import router as locations_router
    api_router.include_router(locations_router)
except ImportError:
    pass