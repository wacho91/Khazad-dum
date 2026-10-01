"""Configuración del motor de base de datos asíncrono."""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base
from sqlalchemy import text

from src.config import settings

# Leemos la URL de la configuración
DATABASE_URL = settings.DATABASE_URL

# Magia: Si el link de Neon empieza con postgres://, lo convertimos a postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

# Configuramos los argumentos de conexión (SSL para Neon)
connect_args = {}
if DATABASE_URL.startswith("postgresql"):
    connect_args = {"ssl": True}
elif DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Creamos el motor
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,
    connect_args=connect_args
)

# Fábrica de sesiones
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Base para los modelos
Base = declarative_base()

# === Funciones que main.py está buscando ===

async def ping():
    """Verifica la conexión a la base de datos."""
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))

async def dispose_engine():
    """Cierra el pool de conexiones al apagar el servidor."""
    await engine.dispose()

# Dependencia para inyectar la sesión en las rutas
async def get_db():
    async with AsyncSessionLocal() as db:
        yield db