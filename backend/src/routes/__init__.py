from fastapi import APIRouter

api_router = APIRouter()

# === IMPORTADOR INTELIGENTE Y A PRUEBA DE ERRORES ===
def try_include(module_path, prefix="", tags=None):
    try:
        module = __import__(module_path, fromlist=['router'])
        api_router.include_router(module.router, prefix=prefix, tags=tags or [])
    except Exception as e:
        # Si el archivo no existe, lo saltamos en silencio.
        # Si el archivo existe pero tiene un error de código, lo imprimimos.
        if not (isinstance(e, ModuleNotFoundError) and module_path.split('.')[-1] in str(e)):
            print(f"⚠️ Error al cargar el router {module_path}: {e}")

# Cargamos todos los posibles routers (en singular y plural por si acaso)
try_include('src.routes.assets', tags=["assets"])
try_include('src.routes.spare_parts', tags=["spare_parts"])
try_include('src.routes.spare_part', tags=["spare_parts"])
try_include('src.routes.tenants', tags=["tenants"])
try_include('src.routes.users', tags=["users"])
try_include('src.routes.auth', prefix="/auth", tags=["Auth"])
try_include('src.routes.work_orders', tags=["work_orders"])
try_include('src.routes.work_order', tags=["work_orders"])
try_include('src.routes.locations', tags=["locations"])
try_include('src.routes.location', tags=["locations"])
try_include('src.routes.cost_entries', tags=["cost_entries"])
try_include('src.routes.cost_entry', tags=["cost_entries"])