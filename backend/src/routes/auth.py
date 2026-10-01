from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
import os
from datetime import datetime, timedelta
import bcrypt

from src.database import get_db
from src.models.user import User

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET", "manttoflow_super_secreto_2024")
ALGORITHM = "HS256"

@router.post("/login")
async def login(db: AsyncSession = Depends(get_db), email: str = Body(...), password: str = Body(...)):
    # 1. Buscamos el usuario en la base de datos por su email
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # 2. Verificamos la contraseña con bcrypt directo
    password_bytes = password.encode('utf-8')
    hash_bytes = user.password_hash.encode('utf-8')
    
    if not bcrypt.checkpw(password_bytes, hash_bytes):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # 3. Generamos el Token JWT
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": token, "token_type": "bearer"}