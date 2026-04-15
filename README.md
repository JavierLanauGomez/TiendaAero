# TiendaAero

Panel de administración (backoffice) para una tienda de aeromodelismo. Gestión completa de catálogo, clientes y pedidos con dashboard de KPIs en tiempo real.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=flat&logo=fastapi&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat&logo=mysql&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Pydantic](https://img.shields.io/badge/Pydantic-2.x-E92063?style=flat&logo=pydantic&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens&logoColor=white)

---

## Descripción

TiendaAero es una aplicación web de gestión interna pensada para el equipo de una tienda de aeromodelismo. No es una tienda para clientes finales — es un **backoffice** desde el que se puede:

- Consultar el estado del negocio de un vistazo en el **dashboard**
- Gestionar el **catálogo** de productos con control de stock
- Administrar **clientes** y consultar su historial de pedidos
- Crear, editar y seguir el estado de **pedidos** con actualización automática de stock

---

## Stack tecnológico

| Capa | Tecnología | Versión | Motivo |
|------|-----------|---------|--------|
| Base de datos | MySQL | 8.0 | Relacional, soporte transaccional nativo |
| Backend | Python + FastAPI | 3.11 / 0.135 | Tipado, validación automática, docs en `/docs` |
| ORM / BD | mysql-connector-python | 9.6 | Conector oficial de MySQL para Python |
| Validación | Pydantic | 2.x | Modelos de datos con validadores declarativos |
| Autenticación | JWT (python-jose) + bcrypt | — | Stateless, seguro, estándar de la industria |
| Servidor ASGI | Uvicorn | 0.44 | Servidor ASGI de alto rendimiento para FastAPI |
| Frontend | HTML + CSS + JS Vanilla | ES2022 | Sin dependencias, funciona sin build step |
| Gráficas | Chart.js | CDN | Gráfica de evolución de ventas |

---

## Funcionalidades

### Dashboard
- Caja diaria con estado (abierta / cerrada)
- KPIs: ventas hoy / semana / mes con comparativas y tendencias (↑ ↓ →)
- Ticket medio del día vs. día anterior
- Top 5 productos más vendidos con barras de progreso
- Gráfica de evolución de ventas (últimos 6 meses) con Chart.js
- Alertas de stock bajo en tiempo real

### Catálogo de productos
- CRUD completo con validación de precio y stock (Pydantic `field_validator`)
- Miniatura de imagen en tabla
- Paginación configurable (`pagina` + `tamano`)
- Filtro por categoría y búsqueda en tiempo real
- Badge visual de stock bajo / stock ok

### Pedidos
- Creación con cálculo de total automático
- Edición de líneas con restauración de stock
- Cambio de estado: `pendiente → enviado → entregado → cancelado`
- Al cancelar, el stock se restaura automáticamente
- `SELECT FOR UPDATE` para prevenir race conditions en stock concurrente

### Clientes
- CRUD con búsqueda en tiempo real
- Historial de pedidos por cliente
- Endpoint `/clientes/{id}/pedidos` (relación jerárquica REST)

### Seguridad
- JWT en cada petición (`Authorization: Bearer <token>`)
- Contraseñas hasheadas con bcrypt
- Expiración configurable (por defecto 8 horas)
- Cierre de sesión automático al recibir 401
- Escape de HTML para prevenir XSS en el frontend

---

## Estructura del proyecto

```
TiendaAero/
├── arrancar.bat                 # Script de arranque Windows (doble clic)
├── database.sql                 # Script completo de BD (tablas + datos de prueba)
├── ARRANCAR.md                  # Guía de puesta en marcha rápida
├── CREAR_DESDE_CERO.md          # Guía paso a paso completa (35 secciones)
├── backend/
│   ├── main.py                  # FastAPI + CORS + routers
│   ├── auth.py                  # JWT: crear, verificar, hashear
│   ├── database.py              # obtener_cursor() context manager
│   ├── crear_admin.py           # Script one-shot para crear el usuario admin
│   ├── requirements.txt         # Dependencias Python
│   ├── .env.example             # Plantilla de variables de entorno
│   └── routers/
│       ├── autenticacion.py     # POST /auth/login, POST /auth/registro
│       ├── categorias.py        # CRUD /categorias
│       ├── productos.py         # CRUD /productos (paginado)
│       ├── clientes.py          # CRUD /clientes + historial
│       ├── pedidos.py           # CRUD /pedidos + estados
│       └── dashboard.py         # GET /dashboard (KPIs)
└── frontend/
    ├── index.html
    ├── css/
    │   └── estilos.css
    └── js/
        ├── config.js            # URL base de la API
        ├── auth.js              # Login, registro, token
        ├── api.js               # fetch wrappers (obtenerDatos, enviarDatos…)
        ├── app.js               # Navegación, modal, toast, confirmar(), formatearFecha()
        ├── dashboard.js         # Renderizado del panel de control
        ├── categorias.js        # CRUD categorías
        ├── productos.js         # CRUD productos
        ├── clientes.js          # CRUD clientes
        └── pedidos.js           # CRUD pedidos
```

---

## Puesta en marcha

### Requisitos previos
- Python 3.11+
- MySQL 8.0+  *(o XAMPP con el módulo MySQL activado)*
- Navegador moderno (Chrome, Firefox, Edge)

### 1. Base de datos

Ejecuta el script SQL para crear la base de datos `tiendaaero` con tablas y datos de ejemplo:

```bash
mysql -u root -p < database.sql
```

O ábrelo en MySQL Workbench y pulsa el rayo ⚡.

### 2. Configurar credenciales

Copia la plantilla y edítala con tus datos:

```bash
cp backend/.env.example backend/.env
```

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=tiendaaero
JWT_SECRET=cambia_esto_por_una_clave_larga_y_aleatoria
```

### 3. Crear el usuario administrador

Ejecuta este comando **una sola vez**:

```bash
# Windows (entorno virtual ya creado)
venv\Scripts\python.exe backend\crear_admin.py
```

### 4. Arrancar la aplicación

**Opción A — Doble clic en `arrancar.bat`** (recomendado en Windows)

El script detecta si es la primera vez, crea el entorno virtual, instala dependencias y abre el navegador en `http://localhost:3000` automáticamente.

**Opción B — Manual**

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux / macOS
pip install -r requirements.txt
uvicorn main:aplicacion --reload
```

Sirve el frontend con cualquier servidor estático (Live Server de VS Code, por ejemplo).

### URLs

| Servicio | URL |
|----------|-----|
| Aplicación (frontend) | http://localhost:3000 |
| API (backend) | http://127.0.0.1:8000 |
| Documentación interactiva de la API | http://127.0.0.1:8000/docs |

---

## API REST — Referencia rápida

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/auth/registro` | No | Crear usuario |
| `POST` | `/auth/login` | No | Obtener JWT |
| `GET` | `/dashboard` | Sí | KPIs del negocio |
| `GET` / `POST` | `/categorias` | Sí | Listar / crear categorías |
| `GET` / `PUT` / `DELETE` | `/categorias/{id}` | Sí | Obtener / editar / eliminar |
| `GET` / `POST` | `/productos` | Sí | Listar (paginado) / crear |
| `GET` / `PUT` / `DELETE` | `/productos/{id}` | Sí | Obtener / editar / eliminar |
| `GET` / `POST` | `/clientes` | Sí | Listar / crear |
| `GET` | `/clientes/{id}/pedidos` | Sí | Historial de un cliente |
| `GET` / `POST` | `/pedidos` | Sí | Listar (paginado) / crear |
| `GET` | `/pedidos/{id}` | Sí | Detalle con líneas |
| `PUT` | `/pedidos/{id}/estado` | Sí | Cambiar estado |
| `PUT` | `/pedidos/{id}/lineas` | Sí | Reemplazar líneas |

Todos los endpoints protegidos requieren cabecera `Authorization: Bearer <token>`.

---

## Decisiones técnicas destacadas

**Context manager `obtener_cursor`** — Garantiza que cada conexión se cierra y que toda operación hace commit o rollback automático, eliminando fugas de conexión.

**`SELECT FOR UPDATE`** — Bloquea la fila de producto durante la transacción al crear o editar un pedido, evitando que dos pedidos simultáneos vendan más stock del disponible.

**Protección por router** — `dependencies=[Depends(obtener_usuario_actual)]` en `include_router` protege todos los endpoints del router de una vez, sin decorar cada función individualmente.

**Modal `confirmar()`** — Reemplaza el `confirm()` nativo del navegador (síncrono, no estilizable) por un modal propio que reutiliza el sistema de modales ya existente.

**Paginación estándar** — Todos los endpoints de listado devuelven `{ items, total, pagina, tamano }` para facilitar la paginación en el frontend.

**Escape de HTML** — Función `escapeHtml()` en el frontend para prevenir XSS al renderizar datos de la API en el DOM.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| La ventana del backend se cierra sola | MySQL no arrancado o credenciales incorrectas | Verifica `.env` y que MySQL esté activo |
| Página en blanco o sin datos | Frontend no servido correctamente | Accede a `http://localhost:3000`, no a `file://...` |
| `python` no se reconoce | Python no está en el PATH | Reinstala Python marcando "Add Python to PATH" |
| Puerto 8000 o 3000 en uso | Otro proceso usa el puerto | Cierra la aplicación que lo ocupa o reinicia el PC |
| Sesión expirada | El token JWT dura 8 horas | Recarga la página e inicia sesión de nuevo |

---

## Documentación extendida

- **`ARRANCAR.md`** — Guía de puesta en marcha rápida para el día a día.
- **`CREAR_DESDE_CERO.md`** — Guía de 35 secciones con el proceso completo de construcción: esquema de BD, cada endpoint con su lógica, decisiones de diseño y preguntas frecuentes de entrevista técnica.
