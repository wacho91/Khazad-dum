"""
Khazad-dûm — Punto de entrada del servidor FastAPI.

Arquitectura Hexagonal:
  * src/domain         → entidades, enums, puertos (interfaces)
  * src/application    → casos de uso / servicios
  * src/infrastructure → adaptadores (DB, repos, routers HTTP)

Este módulo solo orquesta: crea la app, monta routers, configura CORS
y gestiona el ciclo de vida (startup/shutdown) del engine async.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.database import dispose_engine, ping
from src.routes import api_router


logger = logging.getLogger("khazad-dum")


# ---------------------------------------------------------------------------
# Ciclo de vida (lifespan)
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup: verifica DB. Shutdown: cierra el pool asyncpg."""
    logger.info("Starting %s (env=%s)", settings.APP_NAME, settings.ENV)
    try:
        await ping()
        logger.info("Database connectivity OK")
    except Exception as exc:  # pragma: no cover
        logger.warning("Database not reachable at startup: %s", exc)

    yield

    logger.info("Shutting down — disposing DB engine")
    await dispose_engine()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        debug=settings.DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # --- CORS ---
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # --- Routers modulares ---
    app.include_router(api_router)

    # --- Root ---
    @app.get("/", include_in_schema=False)
    async def root() -> JSONResponse:
        return JSONResponse(
            {"service": settings.APP_NAME, "env": settings.ENV, "docs": "/docs"}
        )

    return app


app = create_app()
