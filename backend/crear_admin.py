import asyncio
import uuid
import bcrypt
from sqlalchemy import select
from src.database import AsyncSessionLocal
from src.models.tenant import Tenant
from src.models.user import User
from src.models.enums import UserRole

async def main():
    async with AsyncSessionLocal() as db:
        # 1. Buscamos o creamos la Empresa (Tenant)
        result = await db.execute(select(Tenant).limit(1))
        tenant = result.scalars().first()
        if not tenant:
            tenant = Tenant(id=uuid.uuid4(), name="Planta Industrial Demo", slug="planta-demo")
            db.add(tenant)
            await db.flush()

        # 2. Creamos el usuario Admin
        admin_email = "admin@khazad-dum.com"
        result = await db.execute(select(User).where(User.email == admin_email))
        user = result.scalars().first()
        
        if not user:
            # Encriptamos la contraseña con bcrypt directo
            password_bytes = "Admin123#".encode('utf-8')
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(password_bytes, salt).decode('utf-8')
            
            user = User(
                id=uuid.uuid4(),
                tenant_id=tenant.id,
                email=admin_email,
                password_hash=hashed_password,
                full_name="Administrador General",
                role=UserRole.ADMIN.value, # Rol de Administrador
                is_active=True
            )
            db.add(user)
            await db.commit()
            print("✅ Usuario admin creado. Email: admin@khazad-dum.com | Pass: Admin123#")
        else:
            print("El usuario admin ya existe.")

asyncio.run(main())