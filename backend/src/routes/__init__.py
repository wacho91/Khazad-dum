from fastapi import APIRouter

api_router = APIRouter()

# === IMPORTADOR INTELIGENTE ===
# Intenta importar cada router de la carpeta. Si no existe, lo salta sin error.
try:
    from .assets import router as assets_router
    api_router.include_router(assets_router)
except ImportError:
    pass

try:
    from .locations import router as locations_router
    api_router.include_router(locations_router)
except ImportError:
    pass

try:
    from .spare_parts import router as spare_parts_router
    api_router.include_router(spare_parts_router)
except ImportError:
    pass

try:
    from .tenants import router as tenants_router
    api_router.include_router(tenants_router)
except ImportError:
    pass

try:
    from .users import router as users_router
    api_router.include_router(users_router)
except ImportError:
    pass

try:
    from .work_orders import router as work_orders_router
    api_router.include_router(work_orders_router)
except ImportError:
    pass

try:
    from .cost_entries import router as cost_entries_router
    api_router.include_router(cost_entries_router)
except ImportError:
    pass

# Por si los agentes nombraron los archivos diferente (singular vs plural)
try:
    from .cost_entry import router as cost_entry_router
    api_router.include_router(cost_entry_router)
except ImportError:
    pass

try:
    from .spare_part import router as spare_part_router
    api_router.include_router(spare_part_router)
except ImportError:
    pass

try:
    from .work_order import router as work_order_router
    api_router.include_router(work_order_router)
except ImportError:
    pass