import enum

class TenantPlan(str, enum.Enum):
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"

class AssetStatus(str, enum.Enum):
    OPERATIONAL = "operational"
    MAINTENANCE = "maintenance"
    BROKEN = "broken"