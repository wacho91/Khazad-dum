"""Registro central de schemas Pydantic."""

from src.schemas.common import (
    ErrorResponse,
    MessageResponse,
    PaginatedResponse,
    PaginationParams,
)
from src.schemas.tenant import TenantCreate, TenantRead, TenantUpdate
from src.schemas.user import UserCreate, UserRead, UserUpdate
from src.schemas.location import LocationCreate, LocationRead, LocationUpdate
from src.schemas.asset import (
    AssetCreate,
    AssetRead,
    AssetStatusChange,
    AssetStatusHistoryRead,
    AssetUpdate,
)
from src.schemas.spare_part import (
    SparePartCreate,
    SparePartRead,
    SparePartUpdate,
    StockMovementCreate,
    StockMovementRead,
)
from src.schemas.work_order import (
    WorkOrderCreate,
    WorkOrderPartCreate,
    WorkOrderPartRead,
    WorkOrderRead,
    WorkOrderTaskCreate,
    WorkOrderTaskRead,
    WorkOrderUpdate,
)
from src.schemas.cost_entry import CostEntryCreate, CostEntryRead

__all__ = [
    # common
    "ErrorResponse",
    "MessageResponse",
    "PaginatedResponse",
    "PaginationParams",
    # tenant
    "TenantCreate",
    "TenantRead",
    "TenantUpdate",
    # user
    "UserCreate",
    "UserRead",
    "UserUpdate",
    # location
    "LocationCreate",
    "LocationRead",
    "LocationUpdate",
    # asset
    "AssetCreate",
    "AssetRead",
    "AssetUpdate",
    "AssetStatusChange",
    "AssetStatusHistoryRead",
    # spare part
    "SparePartCreate",
    "SparePartRead",
    "SparePartUpdate",
    "StockMovementCreate",
    "StockMovementRead",
    # work order
    "WorkOrderCreate",
    "WorkOrderRead",
    "WorkOrderUpdate",
    "WorkOrderTaskCreate",
    "WorkOrderTaskRead",
    "WorkOrderPartCreate",
    "WorkOrderPartRead",
    # cost entry
    "CostEntryCreate",
    "CostEntryRead",
]
