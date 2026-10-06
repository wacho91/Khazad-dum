🏔️ Khazad-dum | FacilityTech SaaS ERP

https://khazad-dum-two.vercel.app/login

Python
FastAPI
React
PostgreSQL

🌍 El Problema (El dolor de la industria tradicional)
En la gestión de mantenimiento industrial (Facility Management), el 80% de las empresas medianas gestionan sus máquinas con cuadernos y Excel. Esto genera tres problemas críticos:

Mantenimiento Reactivo (Apagar Incendios): Los técnicos llegan a la máquina solo cuando ya humea o se rompió. La producción se detiene y las pérdidas son millonarias.
Caos en Bodega (Inventario Fantasma): El Excel dice que hay 5 rodamientos, pero físicamente hay 0. La máquina queda parada 3 días esperando un repuesto de emergencia.
Ignorancia del Costo Real (TCO Ciego): Los gerentes no saben cuánto dinero se ha invertido en reparar una máquina a lo largo de su vida útil. No pueden tomar la decisión de reparar o comprar una nueva porque no tienen datos, solo corazonadas.

La Solución: Khazad-dum
Khazad-dum es un ERP (Enterprise Resource Planning) FacilityTech 100% en la nube. Lleva la trazabilidad financiera y operativa de una multinacional a cualquier planta industrial.

🚀 Funcionalidades Principales (Módulos)
🏭 Activos (Máquinas): Registro de equipos con su ubicación y cálculo del Costo Acumulado (TCO) en tiempo real.
🧰 Repuestos (Bodega): Inventario con SKU, stock actual, stock mínimo y costo unitario. Incluye alertas visuales automáticas (⚠️ Reabastecer / ✅ Óptimo).
📋 Órdenes de Trabajo (OT): Creación de mantenciones (preventivas/correctivas) asignadas a una máquina, con prioridad y descripción.
🧾 Motor de Costos (La Magia Financiera): Al "Cerrar" una Orden de Trabajo, el sistema descuenta automáticamente los repuestos de la bodega, calcula el costo de Mano de Obra + Repuestos, y se lo suma al "Costo Acumulado" de la máquina. Genera un recibo detallado.
📊 Dashboard Gerencial: Gráficas de barras (histórico de gastos) y de pastel (distribución de costos), además de tablas con las máquinas más costosas y OTs urgentes.

🏛️ Arquitectura y Stack Tecnológico
Construimos Khazad-dum para ser escalable a miles de máquinas, usando las mejores prácticas de la industria.

Arquitectura Hexagonal & Multi-Tenant
El backend está separado estrictamente en capas (Dominio, Aplicación e Infraestructura). Esto permite cambiar la base de datos o el framework web sin reescribir la lógica de negocio. Además, está preparado para Multi-Tenant (aislamiento de datos por empresa).

<img width="1336" height="488" alt="image" src="https://github.com/user-attachments/assets/f7bec9dd-46e5-4af1-b1ca-29fb846cbcdb" />

🛠️ Stack
Backend: Python 3.11, FastAPI (Asíncrono), SQLAlchemy Asíncrono, Pydantic.
Seguridad: JWT (JSON Web Tokens), Encriptación Bcrypt directa, Validación estricta de esquemas.
Frontend: React 18, Vite, Tailwind CSS, Framer Motion (Animaciones), SweetAlert2, Recharts.
Base de Datos: PostgreSQL (Servido en la nube por Neon.tech).
Despliegue: Backend en Render, Frontend en Vercel.


🛠️ Instalación y Puesta en Marcha (Para Desarrolladores)
Si deseas clonar y correr este proyecto localmente:

Clonar el repositorio:
bash

git clone https://github.com/wacho91/Khazad-dum.git
cd Khazad-dum

Configurar Backend (FastAPI):
bash

cd backend
python -m venv venv
source venv/bin/activate  # En Windows: .\venv\Scripts\activate
pip install -r requirements.txt

Crea un archivo .env en la carpeta backend con las variables:
env

DATABASE_URL=postgresql+asyncpg://user:pass@host/db
JWT_SECRET=tu_secreto_super_seguro
CORS_ORIGINS=["http://localhost:5173"]

Crea las tablas y el usuario admin ejecutando: python crear_admin.py
Levanta el servidor: uvicorn src.main:app --reload --port 8000

Configurar Frontend (React):
bash

cd ../frontend
npm install

Crea un archivo .env en la carpeta frontend con:

VITE_API_URL=http://localhost:8000

Levanta el servidor: npm run dev

🤝 Conclusión
Khazad-dum no es un simple CRUD. Es un sistema de trazabilidad financiera industrial que automatiza el trabajo manual de los jefes de mantenimiento y da visibilidad real a los gerentes. Demuestra la capacidad de diseñar software B2B de nivel Enterprise, desde la concepción del problema hasta el despliegue en la nube.

Ingeniero, Arquitecto de Software & Fundador: Cristian (CEO & Visionario SaaS)
