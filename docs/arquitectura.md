# Arquitectura — Khazad-dûm

## 1. Contexto y objetivos

Khazad-dûm es un SaaS B2B FacilityTech multi-tenant que permite a empresas industriales:

- Registrar y controlar **activos (máquinas)** identificados por **código QR**.
- Gestionar el **inventario de repuestos** con trazabilidad de consumo.
- Asignar y dar seguimiento a **órdenes de trabajo** (preventivas y correctivas) a técnicos.
- Calcular el **TCO (Total Cost of Ownership)** por activo, línea o planta.

### Atributos de calidad prioritarios

| Atributo        | Objetivo                                                        |
|-----------------|-----------------------------------------------------------------|
| Modularidad     | Cada bounded context es desplegable/evolucionable por separado. |
| Seguridad       | Aislamiento estricto por tenant (row-level + JWT claims).       |
| Escalabilidad   | Escalado horizontal stateless (FastAPI + asyncpg + Neon).       |
| Mantenibilidad  | Dominio puro, testeable, sin dependencias de infraestructura.   |
| Observabilidad  | Trazas, métricas y logs estructurados por tenant y request-id.  |

---

## 2. Estilo arquitectónico

**Clean Architecture (Hexagonal)** con **modularidad por bounded context**.
