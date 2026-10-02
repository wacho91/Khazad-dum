from fastapi import APIRouter

api_router = APIRouter()

# === IMPORTACIONES DIRECTAS (Si hay un error, la terminal lo mostrará) ===
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

# ¡Aquí está la clave! Importamos las Órdenes de Trabajo directo.
from .work_orders import router as work_orders_router
api_router.include_router(work_orders_router)

# Los que no existan o fallen, los dejamos en try/except para no romper el server
try:
    from .locations import router as locations_router
    api_router.include_router(locations_router)
except ImportError:
    pass

try:
    from .cost_entries import router as cost_entries_router
    api_router.include_router(cost_entries_router)
except ImportError:
    pass