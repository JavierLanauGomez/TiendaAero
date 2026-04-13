# CREAR TIENDAAERO DESDE CERO
## Guía paso a paso completa

---

## Índice

1. [Planificación del proyecto](#1-planificación-del-proyecto)
2. [Herramientas necesarias](#2-herramientas-necesarias)
3. [Estructura de carpetas](#3-estructura-de-carpetas)
4. [Base de datos](#4-base-de-datos)
5. [Backend — Configuración inicial](#5-backend--configuración-inicial)
6. [Backend — Conexión a la base de datos](#6-backend--conexión-a-la-base-de-datos)
7. [Backend — Autenticación JWT](#7-backend--autenticación-jwt)
8. [Backend — Punto de entrada (main.py)](#8-backend--punto-de-entrada-mainpy)
9. [Backend — Router de Categorías](#9-backend--router-de-categorías)
10. [Backend — Router de Productos](#10-backend--router-de-productos)
11. [Backend — Router de Clientes](#11-backend--router-de-clientes)
12. [Backend — Router de Pedidos](#12-backend--router-de-pedidos)
13. [Frontend — Estructura HTML](#13-frontend--estructura-html)
14. [Frontend — Estilos CSS](#14-frontend--estilos-css)
15. [Frontend — config.js](#15-frontend--configjs)
16. [Frontend — auth.js](#16-frontend--authjs)
17. [Frontend — api.js](#17-frontend--apijs)
18. [Frontend — app.js](#18-frontend--appjs)
19. [Frontend — categorias.js](#19-frontend--categoriasjs)
20. [Frontend — productos.js](#20-frontend--productosjs)
21. [Frontend — clientes.js](#21-frontend--clientesjs)
22. [Frontend — pedidos.js](#22-frontend--pedidosjs)
23. [Script de arranque](#23-script-de-arranque)
24. [Verificación final](#24-verificación-final)

---

## 1. Planificación del proyecto

Antes de escribir una sola línea de código, hay que entender qué se va a construir.

**¿Qué es TiendaAero?**
Una aplicación web de gestión interna para una tienda de aeromodelismo. No es una tienda para clientes finales — es un panel de administración (backoffice) para gestionar el catálogo, los clientes y los pedidos.

**¿Qué entidades tiene?**

Piensa en las "cosas" que la aplicación necesita gestionar:

- **Categorías** → agrupan los productos (Aviones, Drones, Accesorios...)
- **Productos** → artículos del catálogo, cada uno pertenece a una categoría
- **Clientes** → personas que compran
- **Pedidos** → compras realizadas por un cliente, compuestas por uno o más productos

**¿Qué relaciones hay entre ellas?**

- Una categoría tiene muchos productos (1:N)
- Un cliente tiene muchos pedidos (1:N)
- Un pedido tiene muchos productos, y un producto puede estar en muchos pedidos (N:M)
  → Esta última se resuelve con una tabla intermedia: `detalle_pedidos`

**Tecnologías elegidas:**

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Base de datos | MySQL | Relacional, estándar, gratuito |
| Backend | Python + FastAPI | Moderno, validación automática, documentación incluida |
| Frontend | HTML + CSS + JS Vanilla | Sin frameworks, funciona abriendo el fichero |

---

## 2. Herramientas necesarias

Instala esto antes de empezar:

### Python
Descarga de [python.org](https://www.python.org/downloads/). Durante la instalación, **marca "Add Python to PATH"**.

Verifica que funciona:
```bash
python --version
# Python 3.11.x  (o superior)
```

### MySQL
Descarga MySQL Installer de [dev.mysql.com](https://dev.mysql.com/downloads/installer/) o instala XAMPP. Anota la contraseña de `root` que pongas.

Verifica que funciona:
```bash
mysql -u root -p
# Te pide contraseña y entra al cliente MySQL
```

### Editor de código
Visual Studio Code con las extensiones:
- **Python** (Microsoft)
- **Live Server** (Ritwick Dey) — para el frontend (opcional, el `.bat` ya lo resuelve)

---

## 3. Estructura de carpetas

Crea esta estructura de carpetas vacías. Puedes hacerlo desde el explorador de Windows o desde la terminal:

```bash
mkdir TiendaAero
mkdir TiendaAero\backend
mkdir TiendaAero\backend\routers
mkdir TiendaAero\frontend
mkdir TiendaAero\frontend\css
mkdir TiendaAero\frontend\js
```

La estructura final será:

```
TiendaAero/
├── arrancar.bat
├── database.sql
├── ARRANCAR.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── requirements.txt
│   ├── main.py
│   ├── database.py
│   └── routers/
│       ├── __init__.py
│       ├── categorias.py
│       ├── productos.py
│       ├── clientes.py
│       └── pedidos.py
└── frontend/
    ├── index.html
    ├── css/
    │   └── estilos.css
    └── js/
        ├── config.js
        ├── api.js
        ├── app.js
        ├── categorias.js
        ├── productos.js
        ├── clientes.js
        └── pedidos.js
```

---

## 4. Base de datos

### 4.1 Crear el fichero `database.sql`

En la raíz del proyecto crea `database.sql`. Este fichero contiene todo lo necesario para crear la base de datos desde cero.

**¿Por qué un fichero SQL separado?**
Porque cualquier persona que clone el proyecto puede recrear la base de datos con un solo comando, sin depender de exportaciones de Workbench ni de pasos manuales.

```sql
-- ============================================================
-- TiendaAero — Script completo de base de datos
-- Ejecutar:  mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS tiendaaero
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tiendaaero;
```

**¿Por qué `utf8mb4`?**
Es el juego de caracteres completo de MySQL. `utf8` en MySQL solo ocupa 3 bytes y no soporta todos los emojis ni caracteres especiales. `utf8mb4` soporta el estándar Unicode completo.

### 4.2 Tabla `categorias`

```sql
CREATE TABLE categorias (
    id          INT           NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(100)  NOT NULL,
    descripcion TEXT,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Decisiones de diseño:
- `AUTO_INCREMENT` → MySQL asigna el ID solo, no lo manda el cliente.
- `UNIQUE KEY` en `nombre` → no puede haber dos categorías con el mismo nombre. Lo comprueba la base de datos, no solo la aplicación.
- `descripcion TEXT` → campo opcional (sin `NOT NULL`) porque hay categorías cuya descripción es obvia.
- `ENGINE=InnoDB` → es el motor que soporta claves foráneas y transacciones. Sin esto, las restricciones de integridad no funcionan.

### 4.3 Tabla `productos`

```sql
CREATE TABLE productos (
    id           INT            NOT NULL AUTO_INCREMENT,
    nombre       VARCHAR(200)   NOT NULL,
    descripcion  TEXT,
    precio       DECIMAL(10,2)  NOT NULL,
    stock        INT            NOT NULL DEFAULT 0,
    stock_minimo INT            NOT NULL DEFAULT 1,
    categoria_id INT            NOT NULL,
    marca        VARCHAR(100),
    imagen_url   VARCHAR(500),
    PRIMARY KEY (id),
    KEY idx_productos_categoria (categoria_id),
    CONSTRAINT fk_productos_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Decisiones de diseño:
- `DECIMAL(10,2)` para precio → **nunca uses `FLOAT` para dinero**. Los flotantes tienen errores de representación binaria (0.1 + 0.2 = 0.30000000000000004). `DECIMAL` es exacto.
- `stock_minimo` → permite saber cuándo hay que reponer sin lógica adicional.
- `KEY idx_productos_categoria` → índice en la columna de búsqueda frecuente (filtrar productos por categoría). Sin índice, MySQL haría un recorrido completo de la tabla.
- `ON UPDATE CASCADE` → si el `id` de una categoría cambiara, se actualiza automáticamente en todos sus productos.
- `ON DELETE RESTRICT` → **no se puede borrar una categoría que tenga productos**. Esto evita huérfanos en la base de datos.

### 4.4 Tabla `clientes`

```sql
CREATE TABLE clientes (
    id             INT          NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(150) NOT NULL,
    email          VARCHAR(150) NOT NULL,
    telefono       VARCHAR(20),
    direccion      VARCHAR(300),
    fecha_registro DATE         NOT NULL DEFAULT (CURRENT_DATE),
    PRIMARY KEY (id),
    UNIQUE KEY uq_clientes_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Decisiones de diseño:
- `UNIQUE KEY` en `email` → cada cliente tiene un email único. Es el identificador natural de una persona en sistemas digitales.
- `fecha_registro DEFAULT (CURRENT_DATE)` → la base de datos la rellena sola al insertar.
- `telefono VARCHAR(20)` → los teléfonos no son números (tienen prefijos con `+`, espacios, guiones). Siempre se guardan como texto.

### 4.5 Tabla `pedidos`

```sql
CREATE TABLE pedidos (
    id         INT            NOT NULL AUTO_INCREMENT,
    cliente_id INT            NOT NULL,
    fecha      DATE           NOT NULL DEFAULT (CURRENT_DATE),
    estado     ENUM('pendiente','enviado','entregado') NOT NULL DEFAULT 'pendiente',
    total      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    PRIMARY KEY (id),
    KEY idx_pedidos_cliente (cliente_id),
    CONSTRAINT fk_pedidos_cliente
        FOREIGN KEY (cliente_id) REFERENCES clientes (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Decisiones de diseño:
- `ENUM` para estado → limita los valores posibles a nivel de base de datos. Si la aplicación intentara insertar `"cancelado"`, MySQL lo rechazaría.
- `total DECIMAL(10,2)` → se guarda calculado para no tener que recalcularlo en cada lectura (desnormalización controlada y justificada).
- `ON DELETE RESTRICT` en `cliente_id` → no se puede borrar un cliente que tenga pedidos.

### 4.6 Tabla `detalle_pedidos`

```sql
CREATE TABLE detalle_pedidos (
    id              INT           NOT NULL AUTO_INCREMENT,
    pedido_id       INT           NOT NULL,
    producto_id     INT           NOT NULL,
    cantidad        INT           NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_detalle_pedido   (pedido_id),
    KEY idx_detalle_producto (producto_id),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (pedido_id)   REFERENCES pedidos   (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_detalle_producto
        FOREIGN KEY (producto_id) REFERENCES productos (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

Decisiones de diseño:
- **¿Por qué existe esta tabla?** → Un pedido tiene varios productos y un producto puede estar en varios pedidos. Eso es una relación N:M. Las bases de datos relacionales no pueden representar N:M directamente — se necesita una tabla intermedia.
- `precio_unitario` → **crítico**: se guarda el precio en el momento de la compra. Si mañana el producto sube de precio, el historial de pedidos sigue siendo correcto.
- `ON DELETE CASCADE` en `pedido_id` → si se borra un pedido, sus líneas de detalle se borran automáticamente.
- `ON DELETE RESTRICT` en `producto_id` → no se puede borrar un producto que haya sido comprado.

### 4.7 Datos de ejemplo

```sql
INSERT INTO categorias (nombre, descripcion) VALUES
    ('Aviones',      'Aviones de ala fija para radiocontrol'),
    ('Helicopteros', 'Helicopteros RC de distintas escalas'),
    ('Drones',       'Multirrotores FPV y fotografia aerea'),
    ('Radiocontrol', 'Emisoras, receptores y servos'),
    ('Accesorios',   'Baterias, cargadores, helices y herramientas');
```

Añade también `INSERT` de productos, clientes, pedidos y detalle_pedidos con datos realistas para poder probar la aplicación nada más arrancarla.

### 4.8 Ejecutar el script

```bash
mysql -u root -p < database.sql
```

O en MySQL Workbench: Archivo → Abrir script SQL → selecciona `database.sql` → ejecutar (⚡).

---

## 5. Backend — Configuración inicial

### 5.1 Crear el entorno virtual

Un entorno virtual es una carpeta que contiene una instalación de Python aislada del sistema. Así las dependencias del proyecto no interfieren con otros proyectos.

Desde la carpeta raíz `TiendaAero/`:

```bash
python -m venv venv
```

Esto crea la carpeta `venv/` con su propio Python y pip.

### 5.2 Activar el entorno virtual

**Windows (PowerShell):**
```powershell
venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
venv\Scripts\activate.bat
```

Cuando está activo, el prompt cambia a `(venv)`.

### 5.3 Crear `requirements.txt`

En `backend/requirements.txt`:

```
fastapi==0.135.3
uvicorn==0.44.0
mysql-connector-python==9.6.0
python-dotenv==1.2.2
pydantic==2.12.5
```

- **fastapi** → el framework web que usamos para el backend
- **uvicorn** → el servidor que ejecuta FastAPI (como Tomcat en Java)
- **mysql-connector-python** → el driver oficial de MySQL para Python
- **python-dotenv** → carga el fichero `.env` como variables de entorno
- **pydantic** → validación de datos (FastAPI lo instala solo, pero lo incluimos para documentar la versión)

### 5.4 Instalar las dependencias

```bash
pip install -r backend/requirements.txt
```

### 5.5 Crear el fichero `.env`

En `backend/.env` (este fichero **nunca sube a git**):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=tiendaaero
```

### 5.6 Crear el fichero `.env.example`

En `backend/.env.example` (este **sí sube a git**, sirve de plantilla):

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=tiendaaero
```

### 5.7 Crear el `.gitignore`

En la raíz del proyecto, crea `.gitignore` para que git no rastree ficheros sensibles ni innecesarios:

```
# Entorno virtual
venv/

# Variables de entorno (contienen contraseñas)
.env

# Caché de Python
__pycache__/
*.pyc
*.pyo

# VS Code
.vscode/
```

---

## 6. Backend — Conexión a la base de datos

Crea `backend/database.py`:

```python
import os
import mysql.connector
from dotenv import load_dotenv

load_dotenv(override=True)


def obtener_conexion():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )
```

**Explicación línea a línea:**

- `load_dotenv(override=True)` → Lee el fichero `.env` y mete sus variables en el entorno del proceso Python. `override=True` significa que si ya existía la variable en el sistema, la sobreescribe con la del `.env`.
- `def obtener_conexion()` → Función que crea y devuelve una conexión nueva a MySQL cada vez que se llama.
- `os.getenv("DB_HOST")` → Lee la variable `DB_HOST` del entorno (que ya cargó `load_dotenv`).
- `int(os.getenv("DB_PORT"))` → El puerto se lee como string, pero `mysql.connector` lo necesita como entero.

**¿Por qué en un fichero separado?**
Principio de responsabilidad única: este módulo solo sabe cómo conectarse. El resto del código llama a `obtener_conexion()` sin saber nada de MySQL.

---

## 7. Backend — Autenticación JWT

### ¿Qué es JWT y para qué sirve?

Sin autenticación, cualquier persona que conozca la URL de la API puede leer, crear o borrar datos. JWT (JSON Web Token) es el mecanismo estándar para proteger una API REST.

**El flujo es este:**

```
1. El usuario envia usuario + contraseña al endpoint POST /auth/login
2. El backend verifica las credenciales contra la base de datos
3. Si son correctas, genera un TOKEN firmado y lo devuelve
4. El frontend guarda el token en localStorage
5. En cada peticion siguiente, el frontend envia el token en la cabecera:
      Authorization: Bearer eyJhbGc...
6. El backend verifica la firma del token antes de procesar la peticion
7. Si el token es invalido o expiro → HTTP 401, el frontend muestra el login
```

El token es como un carnet firmado por el servidor. El servidor no guarda ninguna sesion — solo verifica que la firma del token sea suya.

### 7.1 Tabla de usuarios en la base de datos

Añade esta tabla al final de las tablas en `database.sql`, antes de los datos de ejemplo:

```sql
CREATE TABLE usuarios (
    id               INT          NOT NULL AUTO_INCREMENT,
    nombre_usuario   VARCHAR(50)  NOT NULL,
    contrasena_hash  VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_nombre (nombre_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- `contrasena_hash` → **nunca se guarda la contraseña en texto plano**. Se guarda el hash bcrypt, que es un valor irreversible de 60 caracteres.
- `VARCHAR(255)` para el hash → bcrypt siempre produce 60 caracteres, pero se usa 255 por convención y compatibilidad.

### 7.2 Variables de entorno nuevas

Añade a `backend/.env`:
```
JWT_SECRET=una_clave_larga_y_aleatoria_que_solo_tu_conoces
```

Y a `backend/.env.example` la misma línea sin el valor real.

**¿Para qué sirve `JWT_SECRET`?**
Es la clave con la que el servidor firma los tokens. Si alguien la conoce, puede fabricar tokens falsos. Por eso nunca va en el código ni en GitHub.

### 7.3 Nuevas dependencias

Añade a `backend/requirements.txt`:
```
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
```

- **python-jose** → crea y verifica tokens JWT
- **passlib[bcrypt]** → hashea y verifica contraseñas con bcrypt
- **python-multipart** → necesario para que FastAPI lea datos de formulario (el login usa form-data, no JSON)

Instálalos:
```bash
pip install python-jose[cryptography] passlib[bcrypt] python-multipart
```

### 7.4 Crear `backend/auth.py`

Este fichero centraliza toda la lógica de seguridad:

```python
import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

CLAVE_SECRETA      = os.getenv("JWT_SECRET", "clave_por_defecto_CAMBIAR")
ALGORITMO          = "HS256"
MINUTOS_EXPIRACION = 60 * 8   # token valido 8 horas

contexto_pwd  = CryptContext(schemes=["bcrypt"], deprecated="auto")
esquema_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verificar_contrasena(plana: str, hashed: str) -> bool:
    return contexto_pwd.verify(plana, hashed)


def hashear_contrasena(contrasena: str) -> str:
    return contexto_pwd.hash(contrasena)


def crear_token(nombre_usuario: str) -> str:
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_EXPIRACION)
    payload = {"sub": nombre_usuario, "exp": expiracion}
    return jwt.encode(payload, CLAVE_SECRETA, algorithm=ALGORITMO)


def obtener_usuario_actual(token: str = Depends(esquema_oauth2)) -> str:
    """
    Dependencia de FastAPI. Se usa en los routers para proteger endpoints.
    Si el token falta, es invalido o expiro → HTTP 401 automatico.
    """
    try:
        payload = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
        usuario = payload.get("sub")
        if usuario is None:
            raise HTTPException(status_code=401, detail="Token invalido")
        return usuario
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")
```

**Conceptos clave:**

- **`CryptContext(schemes=["bcrypt"])`** → configura el motor de hashing. `bcrypt` es lento por diseño (tarda ~100ms), lo que hace inviable descifrar contraseñas por fuerza bruta.
- **`OAuth2PasswordBearer(tokenUrl="/auth/login")`** → le dice a FastAPI dónde está el endpoint de login. FastAPI también usa esto para la documentación automática en `/docs`.
- **`Depends(esquema_oauth2)`** → cuando pones esto como parámetro de una función, FastAPI extrae automáticamente el token del header `Authorization: Bearer <token>` de la petición.
- **`payload = {"sub": usuario, "exp": expiracion}`** → `sub` (subject) y `exp` (expiration) son campos estándar de JWT. `sub` identifica al usuario, `exp` es la fecha de expiración en timestamp Unix.
- **HS256** → algoritmo de firma HMAC-SHA256. Usa la misma clave para firmar y verificar (simétrico). Es el estándar para APIs internas.

### 7.5 Crear `backend/routers/autenticacion.py`

```python
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from database import obtener_conexion
from auth import verificar_contrasena, crear_token

enrutador = APIRouter(prefix="/auth", tags=["autenticacion"])


@enrutador.post("/login")
def login(datos: OAuth2PasswordRequestForm = Depends()):
    conexion = obtener_conexion()
    cursor   = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM usuarios WHERE nombre_usuario = %s",
        (datos.username,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conexion.close()

    if not usuario or not verificar_contrasena(datos.password, usuario["contrasena_hash"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    token = crear_token(usuario["nombre_usuario"])
    return {"access_token": token, "token_type": "bearer"}
```

**¿Por qué `OAuth2PasswordRequestForm` y no un modelo Pydantic normal?**

El estándar OAuth2 define que el endpoint de login debe recibir los datos como `application/x-www-form-urlencoded` (no JSON). FastAPI incluye `OAuth2PasswordRequestForm` que maneja esto automáticamente y expone `datos.username` y `datos.password`.

**¿Por qué verificamos usuario Y contraseña antes de responder?**

Si respondiéramos "usuario no existe" en un caso y "contraseña incorrecta" en otro, un atacante podría usar estos mensajes distintos para saber qué usuarios existen. Al dar siempre el mismo mensaje (`"Usuario o contraseña incorrectos"`), no filtramos esa información.

### 7.6 Crear `backend/crear_admin.py`

Las contraseñas nunca se insertan en texto plano. Este script pide los datos por consola, genera el hash y lo inserta en la base de datos:

```python
import sys
import getpass
from database import obtener_conexion
from auth import hashear_contrasena

def main():
    print("=== Crear usuario administrador ===\n")
    nombre     = input("Nombre de usuario: ").strip()
    contrasena = getpass.getpass("Contraseña: ")
    if len(contrasena) < 6:
        print("La contraseña debe tener al menos 6 caracteres.")
        sys.exit(1)
    if contrasena != getpass.getpass("Repetir contraseña: "):
        print("Las contraseñas no coinciden.")
        sys.exit(1)
    hash_ = hashear_contrasena(contrasena)
    conexion = obtener_conexion()
    cursor   = conexion.cursor()
    cursor.execute(
        "INSERT INTO usuarios (nombre_usuario, contrasena_hash) VALUES (%s, %s)",
        (nombre, hash_)
    )
    conexion.commit()
    cursor.close()
    conexion.close()
    print(f"\nUsuario '{nombre}' creado correctamente.")

if __name__ == "__main__":
    main()
```

**¿Por qué `getpass.getpass()`?** Oculta la contraseña mientras se escribe (no aparece en pantalla), igual que hacen todos los sistemas de login en terminal.

Ejecútalo una sola vez después de crear la base de datos:
```bash
venv\Scripts\python.exe backend\crear_admin.py
```

---

## 8. Backend — Punto de entrada (main.py)

Crea `backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import productos, clientes, pedidos, categorias

aplicacion = FastAPI()

aplicacion.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

aplicacion.include_router(categorias.enrutador)
aplicacion.include_router(productos.enrutador)
aplicacion.include_router(clientes.enrutador)
aplicacion.include_router(pedidos.enrutador)


@aplicacion.get("/")
def inicio():
    return {"mensaje": "Bienvenido a TiendaAero"}
```

**Explicación:**

- `FastAPI()` → crea la aplicación. Es el objeto central que gestiona rutas, middleware, etc.
- `CORSMiddleware` → permite que el navegador haga peticiones desde el frontend (puerto 3000) al backend (puerto 8000). Sin esto, el navegador bloquea todas las peticiones por política de seguridad.
  - `allow_origins` → lista de orígenes permitidos. Solo estos pueden llamar a la API desde un navegador.
  - `allow_methods=["*"]` → permite todos los verbos HTTP (GET, POST, PUT, DELETE).
  - `allow_headers=["*"]` → permite todas las cabeceras HTTP.
- `include_router(...)` → registra los endpoints definidos en cada fichero de routers.
- `@aplicacion.get("/")` → endpoint raíz, útil para comprobar que el servidor está vivo.

**¿Por qué `aplicacion` en vez de `app`?**
Decisión de estilo: todo el proyecto está en español para coherencia y para practicar el nombramiento semántico en el idioma del equipo.

### Crear `backend/routers/__init__.py`

Este fichero **debe existir pero puede estar vacío**. Le dice a Python que la carpeta `routers/` es un paquete, lo que permite hacer `from routers import productos`.

```bash
# Crear fichero vacío
type nul > backend\routers\__init__.py
```

---

## 9. Backend — Router de Categorías

Crea `backend/routers/categorias.py`.

Este fichero sigue una estructura que se repetirá en todos los routers. Aprende bien este patrón porque los demás son iguales.

### 8.1 Importaciones y modelos

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obtener_conexion

enrutador = APIRouter()
```

- `APIRouter()` → es como un "mini FastAPI" para agrupar endpoints relacionados. En `main.py` los registramos todos juntos.
- `HTTPException` → permite lanzar errores HTTP con código y mensaje.

```python
class CategoriaNueva(BaseModel):
    nombre:      str
    descripcion: str | None = None


class CategoriaActualizar(BaseModel):
    nombre:      str | None = None
    descripcion: str | None = None
```

**¿Por qué dos clases?**
- `CategoriaNueva` → para crear. `nombre` es obligatorio (sin valor por defecto). `descripcion` es opcional.
- `CategoriaActualizar` → para actualizar. Todos los campos son opcionales (`| None = None`) porque el cliente puede querer cambiar solo el nombre, o solo la descripción, o ambos.

**¿Qué hace Pydantic?**
FastAPI usa estas clases para validar automáticamente el JSON que llega. Si `nombre` falta en una petición POST, FastAPI devuelve HTTP 422 con un mensaje descriptivo sin que escribas código de validación.

### 8.2 GET — Listar todas las categorías

```python
@enrutador.get("/categorias")
def listar_categorias():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categorias")
    categorias = cursor.fetchall()
    cursor.close()
    conexion.close()
    return categorias
```

- `cursor(dictionary=True)` → los resultados se devuelven como diccionarios Python (`{"id": 1, "nombre": "Aviones"}`) en vez de tuplas. FastAPI los convierte a JSON automáticamente.
- `fetchall()` → recupera todas las filas.
- Siempre cerramos cursor y conexión para liberar recursos.

### 8.3 GET — Obtener una categoría por ID

```python
@enrutador.get("/categorias/{id}")
def obtener_categoria(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categorias WHERE id = %s", (id,))
    categoria = cursor.fetchone()
    cursor.close()
    conexion.close()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return categoria
```

- `{id}` en la ruta → FastAPI extrae el valor y lo pasa como parámetro `id: int` (ya lo convierte a entero y valida que sea un número).
- `%s` en el SQL → **nunca concatenes valores directamente en el SQL**. Usa siempre parámetros para evitar inyección SQL. El segundo argumento es una tupla: `(id,)` — la coma es necesaria para que Python lo trate como tupla y no como paréntesis.
- `fetchone()` → devuelve una sola fila o `None` si no existe.
- Si no existe → `raise HTTPException(status_code=404)` → FastAPI devuelve `{"detail": "Categoria no encontrada"}` con código HTTP 404.

### 8.4 POST — Crear categoría

```python
@enrutador.post("/categorias", status_code=201)
def crear_categoria(categoria: CategoriaNueva):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        "INSERT INTO categorias (nombre, descripcion) VALUES (%s, %s)",
        (categoria.nombre, categoria.descripcion)
    )
    conexion.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conexion.close()
    return {"id": nuevo_id, "mensaje": "Categoria creada"}
```

- `status_code=201` → HTTP 201 Created es el código correcto para indicar que se creó un recurso. El 200 genérico también funciona pero 201 es más preciso.
- `categoria: CategoriaNueva` → FastAPI valida el cuerpo de la petición con el modelo Pydantic y lo convierte al objeto.
- `conexion.commit()` → **sin esto, los cambios no se guardan**. MySQL trabaja con transacciones; `commit()` confirma los cambios.
- `cursor.lastrowid` → el ID que MySQL asignó a la nueva fila (el `AUTO_INCREMENT`).

### 8.5 PUT — Actualizar categoría

```python
@enrutador.put("/categorias/{id}")
def actualizar_categoria(id: int, datos: CategoriaActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sentencia = "UPDATE categorias SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(sentencia, valores)
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return {"mensaje": "Categoria actualizada"}
```

- `datos.model_dump()` → convierte el modelo Pydantic a diccionario Python.
- `{k: v for k, v in ... if v is not None}` → filtra solo los campos que el cliente realmente envió (los que no son `None`).
- El SQL se construye dinámicamente: si llegan `{nombre: "Drones"}`, genera `UPDATE categorias SET nombre = %s WHERE id = %s`.
- `cursor.rowcount` → filas afectadas por el UPDATE. Si es 0, el ID no existía → HTTP 404.

### 8.6 DELETE — Eliminar categoría

```python
@enrutador.delete("/categorias/{id}")
def eliminar_categoria(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM categorias WHERE id = %s", (id,))
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return {"mensaje": "Categoria eliminada"}
```

Nota: si la categoría tiene productos asociados, MySQL lanzará un error por la clave foránea con `ON DELETE RESTRICT`. FastAPI lo capturará como error 500. En una versión mejorada se capturaría específicamente y se devolvería un 400 con un mensaje claro.

---

## 10. Backend — Router de Productos

Crea `backend/routers/productos.py`. Sigue exactamente el mismo patrón que categorías, con una diferencia: el endpoint GET soporta filtrado por categoría.

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obtener_conexion

enrutador = APIRouter()


class ProductoNuevo(BaseModel):
    nombre:       str
    descripcion:  str | None = None
    precio:       float
    stock:        int        = 0
    stock_minimo: int        = 1
    categoria_id: int
    marca:        str | None = None
    imagen_url:   str | None = None


class ProductoActualizar(BaseModel):
    nombre:       str | None = None
    descripcion:  str | None = None
    precio:       float | None = None
    stock:        int | None = None
    stock_minimo: int | None = None
    categoria_id: int | None = None
    marca:        str | None = None
    imagen_url:   str | None = None


@enrutador.get("/productos")
def listar_productos(categoria: int = None):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    if categoria is None:
        cursor.execute("SELECT * FROM productos")
    else:
        cursor.execute("SELECT * FROM productos WHERE categoria_id = %s", (categoria,))
    productos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return productos
```

El parámetro `categoria: int = None` en la función es un **query parameter**. FastAPI lo lee de la URL automáticamente: `GET /productos?categoria=3`. Si no se envía, es `None` y devuelve todos los productos.

Los endpoints GET por ID, POST, PUT y DELETE son idénticos al patrón de categorías — cópialos y adapta los nombres de campos y tabla.

---

## 11. Backend — Router de Clientes

Crea `backend/routers/clientes.py`. Mismo patrón exacto que categorías y productos.

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obtener_conexion

enrutador = APIRouter()


class ClienteNuevo(BaseModel):
    nombre:    str
    email:     str
    telefono:  str | None = None
    direccion: str | None = None


class ClienteActualizar(BaseModel):
    nombre:    str | None = None
    email:     str | None = None
    telefono:  str | None = None
    direccion: str | None = None
```

Los cinco endpoints (GET lista, GET por ID, POST, PUT, DELETE) siguen el mismo patrón. Cópialos de categorías cambiando "categoria" por "cliente" y los campos correspondientes.

---

## 12. Backend — Router de Pedidos

Crea `backend/routers/pedidos.py`. Este es el más complejo porque crear un pedido implica lógica de negocio real.

### 11.1 Modelos

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from database import obtener_conexion

enrutador = APIRouter()


class LineaPedido(BaseModel):
    producto_id: int
    cantidad:    int


class PedidoNuevo(BaseModel):
    cliente_id: int
    lineas:     list[LineaPedido]


class EstadoPedido(BaseModel):
    estado: Literal["pendiente", "enviado", "entregado"]
```

- `LineaPedido` → representa una línea del pedido (un producto y su cantidad).
- `PedidoNuevo` → un pedido tiene un cliente y una lista de líneas.
- `Literal[...]` → Pydantic valida que el valor sea exactamente uno de los indicados.

### 11.2 GET — Listar pedidos

```python
@enrutador.get("/pedidos")
def listar_pedidos():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pedidos")
    pedidos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return pedidos
```

### 11.3 GET — Obtener pedido con sus líneas

```python
@enrutador.get("/pedidos/{id}")
def obtener_pedido(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pedidos WHERE id = %s", (id,))
    pedido = cursor.fetchone()
    if pedido is None:
        cursor.close()
        conexion.close()
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    cursor.execute("SELECT * FROM detalle_pedidos WHERE pedido_id = %s", (id,))
    pedido["lineas"] = cursor.fetchall()
    cursor.close()
    conexion.close()
    return pedido
```

Aquí se hacen dos consultas con la misma conexión: primero el pedido, luego sus líneas. Se añaden las líneas como clave `"lineas"` dentro del diccionario del pedido antes de devolverlo.

### 11.4 POST — Crear pedido (lógica completa)

```python
@enrutador.post("/pedidos", status_code=201)
def crear_pedido(pedido: PedidoNuevo):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    total = 0
    lineas_con_precio = []

    # FASE 1: Validar stock y calcular total
    for linea in pedido.lineas:
        cursor.execute("SELECT precio, stock FROM productos WHERE id = %s", (linea.producto_id,))
        producto = cursor.fetchone()
        if producto is None:
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail=f"Producto {linea.producto_id} no encontrado")
        if producto["stock"] < linea.cantidad:
            cursor.close()
            conexion.close()
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para el producto {linea.producto_id} (disponible: {producto['stock']})"
            )
        precio_unitario = producto["precio"]
        total += precio_unitario * linea.cantidad
        lineas_con_precio.append((linea.producto_id, linea.cantidad, precio_unitario))

    # FASE 2: Insertar pedido
    cursor.execute(
        "INSERT INTO pedidos (cliente_id, total) VALUES (%s, %s)",
        (pedido.cliente_id, round(total, 2))
    )
    nuevo_id = cursor.lastrowid

    # FASE 3: Insertar líneas y descontar stock
    for producto_id, cantidad, precio_unitario in lineas_con_precio:
        cursor.execute(
            "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (%s, %s, %s, %s)",
            (nuevo_id, producto_id, cantidad, precio_unitario)
        )
        cursor.execute(
            "UPDATE productos SET stock = stock - %s WHERE id = %s",
            (cantidad, producto_id)
        )

    # FASE 4: Confirmar la transacción
    conexion.commit()
    cursor.close()
    conexion.close()
    return {"id": nuevo_id, "total": round(total, 2), "mensaje": "Pedido creado"}
```

**¿Por qué separar en fases?**

Primero validamos todo (fase 1) antes de insertar nada (fases 2 y 3). Si hay algún problema (producto no existe, stock insuficiente), salimos sin haber tocado la base de datos. Así no quedan pedidos a medias.

**¿Por qué un solo `commit()` al final?**

Todas las operaciones de inserción y actualización se hacen dentro de la misma transacción MySQL (que empieza implícitamente). El `commit()` confirma todo de golpe. Si ocurre un error antes de llegar al `commit()`, nada se guarda — la base de datos queda exactamente como estaba.

### 11.5 PUT — Cambiar estado del pedido

```python
@enrutador.put("/pedidos/{id}/estado")
def actualizar_estado_pedido(id: int, datos: EstadoPedido):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("UPDATE pedidos SET estado = %s WHERE id = %s", (datos.estado, id))
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return {"mensaje": "Estado actualizado"}
```

La ruta `/pedidos/{id}/estado` (con subruta) en vez de un PUT general al pedido es una decisión deliberada: el estado es lo único que se puede cambiar en un pedido una vez creado. Así queda explícito en la API qué se puede modificar.

---

## 13. Frontend — Estructura HTML

Crea `frontend/index.html`. Es el único fichero HTML del proyecto — toda la aplicación vive aquí.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TiendaAero</title>
  <link rel="stylesheet" href="css/estilos.css">
</head>
<body>

  <!-- BARRA LATERAL DE NAVEGACION -->
  <nav class="sidebar">
    <div class="logo">✈ TiendaAero</div>
    <ul class="nav-lista">
      <li><a href="#categorias" class="nav-enlace" data-seccion="categorias">Categorias</a></li>
      <li><a href="#productos"  class="nav-enlace" data-seccion="productos">Productos</a></li>
      <li><a href="#clientes"   class="nav-enlace" data-seccion="clientes">Clientes</a></li>
      <li><a href="#pedidos"    class="nav-enlace" data-seccion="pedidos">Pedidos</a></li>
    </ul>
  </nav>

  <!-- CONTENIDO PRINCIPAL -->
  <main class="contenido">

    <section id="sec-categorias" class="seccion oculta">
      <div class="sec-cabecera">
        <h1>Categorias</h1>
        <button class="btn btn-primario" onclick="abrirFormCategoria()">+ Nueva categoria</button>
      </div>
      <div id="tabla-categorias"></div>
    </section>

    <section id="sec-productos" class="seccion oculta">
      <div class="sec-cabecera">
        <h1>Productos</h1>
        <button class="btn btn-primario" onclick="abrirFormProducto()">+ Nuevo producto</button>
      </div>
      <div id="tabla-productos"></div>
    </section>

    <section id="sec-clientes" class="seccion oculta">
      <div class="sec-cabecera">
        <h1>Clientes</h1>
        <button class="btn btn-primario" onclick="abrirFormCliente()">+ Nuevo cliente</button>
      </div>
      <div id="tabla-clientes"></div>
    </section>

    <section id="sec-pedidos" class="seccion oculta">
      <div class="sec-cabecera">
        <h1>Pedidos</h1>
        <button class="btn btn-primario" onclick="abrirFormPedido()">+ Nuevo pedido</button>
      </div>
      <div id="tabla-pedidos"></div>
    </section>

  </main>

  <!-- MODAL COMPARTIDO -->
  <div id="modal" class="modal-fondo oculta">
    <div class="modal-caja">
      <div class="modal-cabecera">
        <h2 id="modal-titulo"></h2>
        <button class="modal-cerrar" onclick="cerrarModal()">✕</button>
      </div>
      <div id="modal-cuerpo"></div>
    </div>
  </div>

  <!-- TOAST (notificación emergente) -->
  <div id="toast" class="toast oculta"></div>

  <!-- SCRIPTS en orden de dependencia -->
  <script src="js/config.js"></script>
  <script src="js/api.js"></script>
  <script src="js/app.js"></script>
  <script src="js/categorias.js"></script>
  <script src="js/productos.js"></script>
  <script src="js/clientes.js"></script>
  <script src="js/pedidos.js"></script>

</body>
</html>
```

**Decisiones de diseño:**

- **Todas las secciones están en el HTML con clase `oculta`** → el JS las muestra/oculta según la navegación. Es una SPA (Single Page Application) sin recarga de página.
- **`data-seccion="categorias"`** → atributo personalizado que el JS usa para saber qué sección corresponde a cada enlace del menú.
- **Modal único compartido** → en vez de un modal por sección, hay uno solo que se rellena dinámicamente. Menos código, misma funcionalidad.
- **Scripts al final del `<body>`** → se cargan después del HTML para que el DOM ya exista cuando los scripts se ejecutan.
- **Orden de los scripts** → cada fichero depende de los anteriores: `config.js` define la URL, `api.js` la usa, `app.js` define el modal, los módulos lo usan.

---

## 14. Frontend — Estilos CSS

Crea `frontend/css/estilos.css`.

El CSS define la apariencia visual. Las clases más importantes que usa el JavaScript son:

```css
/* Clase que oculta cualquier elemento */
.oculta {
  display: none;
}
```

Esta es la clase clave: el JS añade y quita `oculta` para mostrar/esconder secciones, el modal y el toast.

El resto del CSS define el layout (sidebar + contenido principal con CSS Grid o Flexbox), los estilos de tablas, botones, formularios, el modal y los colores del badge de estado del pedido (`badge-pendiente`, `badge-enviado`, `badge-entregado`).

---

## 15. Frontend — config.js

Crea `frontend/js/config.js`:

```javascript
// URL base de la API. Cambia esto si tu backend corre en otro puerto.
const API_URL = 'http://127.0.0.1:8000';
```

Un solo fichero, una sola constante. Toda la configuración de la URL del backend está aquí. Si el backend cambia de dirección, solo se toca este fichero.

---

## 16. Frontend — auth.js

Crea `frontend/js/auth.js`. Este fichero gestiona todo lo relacionado con la sesión del usuario: guardar el token, mostrarlo, borrarlo y decidir qué pantalla enseñar al arrancar.

```javascript
const CLAVE_TOKEN = 'tiendaaero_token';

function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}

function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  mostrarPantallaLogin();
}

function mostrarPantallaLogin() {
  document.getElementById('app').classList.add('oculta');
  document.getElementById('pantalla-login').classList.remove('oculta');
  document.getElementById('login-usuario').value = '';
  document.getElementById('login-contrasena').value = '';
  document.getElementById('login-error').textContent = '';
}

function mostrarApp() {
  document.getElementById('pantalla-login').classList.add('oculta');
  document.getElementById('app').classList.remove('oculta');
}

async function enviarLogin(evento) {
  evento.preventDefault();
  const usuario    = document.getElementById('login-usuario').value.trim();
  const contrasena = document.getElementById('login-contrasena').value;
  const errorDiv   = document.getElementById('login-error');
  errorDiv.textContent = '';

  // El endpoint de login espera form-data, no JSON (estandar OAuth2)
  const cuerpo = new URLSearchParams({ username: usuario, password: contrasena });

  try {
    const respuesta = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: cuerpo.toString()
    });
    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      errorDiv.textContent = datos.detail || 'Usuario o contraseña incorrectos';
      return;
    }
    const datos = await respuesta.json();
    guardarToken(datos.access_token);
    mostrarApp();
    if (!location.hash) location.hash = '#categorias';
    navegarA(location.hash);
  } catch (_) {
    errorDiv.textContent = 'No se puede conectar con el servidor';
  }
}

// Al cargar la pagina: si hay token guardado, mostrar la app directamente.
// Si no, mostrar la pantalla de login.
window.addEventListener('load', () => {
  if (obtenerToken()) {
    mostrarApp();
  } else {
    mostrarPantallaLogin();
  }
});
```

**Conceptos clave:**

- **`localStorage`** → almacenamiento del navegador que persiste entre recargas y pestañas. El token se guarda aquí para que el usuario no tenga que iniciar sesión cada vez que recarga la página.
- **`URLSearchParams`** → construye el cuerpo en formato `application/x-www-form-urlencoded` (`username=admin&password=1234`). Lo necesita el endpoint de login porque sigue el estándar OAuth2 (que usa form-data, no JSON).
- **Por qué `auth.js` se carga antes que `api.js`** → `api.js` llama a `obtenerToken()` y `cerrarSesion()`, que están definidas aquí. Si `api.js` se cargara primero, daría error.

---

## 17. Frontend — api.js

Crea `frontend/js/api.js`:

```javascript
async function obtenerDatos(ruta) {
  const respuesta = await fetch(API_URL + ruta);
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al obtener datos');
  }
  return respuesta.json();
}

async function enviarDatos(ruta, datos) {
  const respuesta = await fetch(API_URL + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al crear');
  }
  return respuesta.json();
}

async function modificarDatos(ruta, datos) {
  const respuesta = await fetch(API_URL + ruta, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al actualizar');
  }
  return respuesta.json();
}

async function borrarDatos(ruta) {
  const respuesta = await fetch(API_URL + ruta, { method: 'DELETE' });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al eliminar');
  }
  return respuesta.json();
}
```

**¿Por qué estas cuatro funciones?**

Sin ellas, cada módulo repetiría el mismo código de `fetch` con cabeceras y manejo de errores. Estas funciones son una capa de abstracción: el resto del código solo llama a `obtenerDatos('/productos')` y no sabe nada de `fetch`, cabeceras ni códigos HTTP.

**Manejo de errores:**
- `if (!respuesta.ok)` → si el código HTTP es 4xx o 5xx, `ok` es `false`.
- Se intenta leer el JSON del error (que FastAPI siempre devuelve como `{"detail": "..."}`) y se lanza un `Error` con ese mensaje.
- `.catch(() => ...)` → si el cuerpo del error no es JSON válido, se usa el texto del estado HTTP como fallback.
- El `throw new Error(...)` hace que los `catch` de los módulos que llamen a estas funciones reciban el mensaje de error legible.

---

## 18. Frontend — app.js

Crea `frontend/js/app.js`:

```javascript
// Mapa de secciones
const SECCIONES = {
  categorias: { idSeccion: 'sec-categorias', cargarDatos: () => cargarCategorias() },
  productos:  { idSeccion: 'sec-productos',  cargarDatos: () => cargarProductos()  },
  clientes:   { idSeccion: 'sec-clientes',   cargarDatos: () => cargarClientes()   },
  pedidos:    { idSeccion: 'sec-pedidos',     cargarDatos: () => cargarPedidos()    },
};

function navegarA(hash) {
  const clave = (hash || '').replace('#', '') || 'categorias';

  document.querySelectorAll('.seccion').forEach(s => s.classList.add('oculta'));
  document.querySelectorAll('.nav-enlace').forEach(e => e.classList.remove('activo'));

  const config = SECCIONES[clave];
  if (!config) return;

  document.getElementById(config.idSeccion).classList.remove('oculta');
  const enlace = document.querySelector(`[data-seccion="${clave}"]`);
  if (enlace) enlace.classList.add('activo');

  config.cargarDatos();
}

function abrirModal(titulo, contenidoHtml) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-cuerpo').innerHTML = contenidoHtml;
  document.getElementById('modal').classList.remove('oculta');
}

function cerrarModal() {
  document.getElementById('modal').classList.add('oculta');
  document.getElementById('modal-cuerpo').innerHTML = '';
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) cerrarModal();
});

let _temporizadorToast = null;

function mostrarToast(mensaje, tipo = 'exito') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = `toast toast-${tipo}`;
  clearTimeout(_temporizadorToast);
  _temporizadorToast = setTimeout(() => toast.classList.add('oculta'), 3000);
}

function mostrarMensaje(idContenedor, texto, esError = false) {
  document.getElementById(idContenedor).innerHTML =
    `<div class="mensaje-estado ${esError ? 'error' : ''}">${texto}</div>`;
}

window.addEventListener('hashchange', () => navegarA(location.hash));
window.addEventListener('load', () => {
  if (!location.hash) location.hash = '#categorias';
  navegarA(location.hash);
});
```

**Navegación SPA:**
- Escucha el evento `hashchange` → se dispara cuando cambia el `#hash` de la URL (al hacer clic en los enlaces del sidebar).
- Escucha el evento `load` → cuando se carga la página, navega a la sección del hash actual (o a categorías por defecto).
- `navegarA()` oculta todas las secciones, muestra la correcta y llama a la función de carga de datos.

**Modal:**
- `abrirModal(titulo, html)` → inyecta el contenido en el modal y lo muestra.
- `cerrarModal()` → oculta el modal y limpia su contenido.
- El listener en el fondo del modal → cierra al hacer clic fuera de la caja.

**Toast:**
- `clearTimeout(_temporizadorToast)` → cancela el temporizador anterior para que si aparece un segundo toast antes de 3 segundos, el contador se reinicie.

---

## 19. Frontend — categorias.js

Crea `frontend/js/categorias.js`. Este módulo sigue el patrón que todos los demás copiarán.

```javascript
var _categorias = [];

async function cargarCategorias() {
  mostrarMensaje('tabla-categorias', 'Cargando...');
  try {
    _categorias = await obtenerDatos('/categorias');
    if (_categorias.length === 0) {
      mostrarMensaje('tabla-categorias', 'No hay categorias todavia.');
      return;
    }
    document.getElementById('tabla-categorias').innerHTML = `
      <table class="tabla">
        <thead>
          <tr><th>ID</th><th>Nombre</th><th>Descripcion</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          ${_categorias.map(cat => `
            <tr>
              <td>${cat.id}</td>
              <td>${cat.nombre}</td>
              <td>${cat.descripcion || '—'}</td>
              <td class="acciones">
                <button class="btn btn-secundario btn-sm"
                        onclick="abrirFormCategoria(${cat.id})">Editar</button>
                <button class="btn btn-peligro btn-sm"
                        onclick="eliminarCategoria(${cat.id})">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    mostrarMensaje('tabla-categorias', 'Error: ' + error.message, true);
  }
}

function abrirFormCategoria(id) {
  const categoria = id ? _categorias.find(c => c.id === id) : null;
  const esEdicion = categoria !== null;

  abrirModal(esEdicion ? 'Editar categoria' : 'Nueva categoria', `
    <form onsubmit="guardarCategoria(event, ${id || ''})">
      <div class="campo">
        <label>Nombre *</label>
        <input type="text" id="cat-nombre" value="${categoria?.nombre || ''}" required>
      </div>
      <div class="campo">
        <label>Descripcion</label>
        <textarea id="cat-descripcion">${categoria?.descripcion || ''}</textarea>
      </div>
      <div class="form-botones">
        <button type="button" class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Guardar</button>
      </div>
    </form>
  `);
}

async function guardarCategoria(evento, id) {
  evento.preventDefault();
  const datos = {
    nombre:      document.getElementById('cat-nombre').value,
    descripcion: document.getElementById('cat-descripcion').value || null
  };
  try {
    if (id) {
      await modificarDatos(`/categorias/${id}`, datos);
      mostrarToast('Categoria actualizada');
    } else {
      await enviarDatos('/categorias', datos);
      mostrarToast('Categoria creada');
    }
    cerrarModal();
    cargarCategorias();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

async function eliminarCategoria(id) {
  if (!confirm('¿Eliminar esta categoria?')) return;
  try {
    await borrarDatos(`/categorias/${id}`);
    mostrarToast('Categoria eliminada');
    cargarCategorias();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}
```

**Patrón que se repite en todos los módulos:**
1. Variable `_lista` → caché de los datos en memoria
2. `cargarX()` → carga datos y genera HTML de la tabla
3. `abrirFormX(id?)` → abre el modal con formulario (creación si `id` es undefined, edición si tiene valor)
4. `guardarX(evento, id?)` → recoge el formulario y llama a POST o PUT según si hay `id`
5. `eliminarX(id)` → confirma y llama a DELETE

---

## 20. Frontend — productos.js

Crea `frontend/js/productos.js`. Mismo patrón que categorías. La diferencia es que el formulario incluye un `<select>` para elegir la categoría, que se rellena con `_categorias` (variable definida en `categorias.js`).

```javascript
var _productos = [];

async function cargarProductos() {
  mostrarMensaje('tabla-productos', 'Cargando...');
  try {
    // Cargar categorias si no están en caché (para mostrar el nombre)
    if (_categorias.length === 0) {
      _categorias = await obtenerDatos('/categorias');
    }
    _productos = await obtenerDatos('/productos');
    // ... renderizar tabla igual que en categorías
  } catch (error) {
    mostrarMensaje('tabla-productos', 'Error: ' + error.message, true);
  }
}
```

El formulario de producto incluye todos sus campos: nombre, descripción, precio, stock, stock mínimo, categoría (select), marca e imagen URL.

---

## 21. Frontend — clientes.js

Crea `frontend/js/clientes.js`. Mismo patrón. Campos: nombre, email, teléfono, dirección.

```javascript
var _clientes = [];
```

Mismas cinco funciones: `cargarClientes`, `abrirFormCliente`, `guardarCliente`, `eliminarCliente`.

---

## 22. Frontend — pedidos.js

Crea `frontend/js/pedidos.js`. Es el más complejo por el formulario dinámico de líneas.

```javascript
var _pedidos = [];
var _contadorLineas = 0;

async function cargarPedidos() { ... }

async function verDetallePedido(id) {
  // Carga el pedido con sus lineas y lo muestra en el modal
  const pedido = await obtenerDatos(`/pedidos/${id}`);
  abrirModal(`Pedido #${id}`, /* tabla con las lineas */);
}

async function cambiarEstado(id, nuevoEstado) {
  await modificarDatos(`/pedidos/${id}/estado`, { estado: nuevoEstado });
  cargarPedidos();
}

async function abrirFormPedido() {
  // Cargar clientes y productos para los selects
  _contadorLineas = 0;
  // Renderizar formulario con select de cliente
  agregarLineaPedido(); // añadir la primera línea automáticamente
}

function agregarLineaPedido() {
  // Crear un nuevo div con select de producto e input de cantidad
  // Conectar onchange a recalcularTotal()
  _contadorLineas++;
  // ...
}

function quitarLinea(numero) {
  document.getElementById(`linea-${numero}`).remove();
  recalcularTotal();
}

function recalcularTotal() {
  // Recorrer todas las .linea-pedido
  // Buscar el precio en _productos
  // Sumar precio * cantidad
  // Actualizar #total-estimado
}

async function guardarPedido(evento) {
  evento.preventDefault();
  // Recoger cliente_id y todas las lineas del DOM
  // Llamar a enviarDatos('/pedidos', {...})
  // Refrescar _productos (stock actualizado) y cargarPedidos()
}
```

**Puntos clave del formulario dinámico:**

- `_contadorLineas` da IDs únicos a cada línea (`linea-1`, `linea-2`...) para poder referenciarlas aunque se eliminen en cualquier orden.
- `recalcularTotal()` se llama en cada cambio de producto o cantidad. Lee los precios de `_productos` (caché local) sin hacer peticiones al backend.
- Al guardar, después de crear el pedido se refresca `_productos` con `obtenerDatos('/productos')` para que el stock mostrado esté actualizado.

---

## 23. Script de arranque

Crea `arrancar.bat` en la raíz del proyecto:

```bat
@echo off
title TiendaAero

if not exist "%~dp0venv\Scripts\python.exe" (
    echo Creando entorno virtual e instalando dependencias...
    python -m venv "%~dp0venv"
    "%~dp0venv\Scripts\pip.exe" install -r "%~dp0backend\requirements.txt"
)

start "TiendaAero - Backend"  cmd /k "cd /d "%~dp0backend"  && "%~dp0venv\Scripts\uvicorn.exe" main:aplicacion --reload"
start "TiendaAero - Frontend" cmd /k "cd /d "%~dp0frontend" && "%~dp0venv\Scripts\python.exe" -m http.server 3000"

timeout /t 2 /nobreak >nul
start http://localhost:3000
```

Este script:
1. Crea el entorno virtual si no existe y lo instala todo.
2. Abre el backend en una ventana nueva.
3. Abre el frontend como servidor HTTP en otra ventana.
4. Abre el navegador automáticamente.

---

## 24. Verificación final

### Prueba el backend

Con el backend arrancado, abre en el navegador:

```
http://127.0.0.1:8000/docs
```

Verás la documentación interactiva de Swagger UI generada automáticamente por FastAPI. Puedes probar cada endpoint desde aquí sin necesitar Postman.

Prueba básica de que funciona:
- `GET /categorias` → debe devolver la lista de categorías
- `POST /categorias` con body `{"nombre": "Test"}` → debe devolver `{"id": 6, "mensaje": "Categoria creada"}`
- `DELETE /categorias/6` → debe devolver `{"mensaje": "Categoria eliminada"}`

### Prueba el frontend

Con ambos servidores arrancados, abre:

```
http://localhost:3000
```

Verifica que:
- La barra lateral navega entre secciones sin recargar la página
- Se cargan los datos de la base de datos en las tablas
- El modal se abre al crear o editar
- El toast aparece y desaparece al guardar
- El formulario de pedidos calcula el total en tiempo real
- Al crear un pedido el stock se actualiza

### Orden de creación recomendado para pruebas

1. Crear una categoría
2. Crear un producto en esa categoría
3. Crear un cliente
4. Crear un pedido con ese cliente y ese producto
5. Verificar que el stock del producto bajó
6. Cambiar el estado del pedido a "enviado"

---

## Resumen del flujo de datos

```
USUARIO
  │
  │ Hace clic / rellena formulario
  ▼
FRONTEND (JavaScript)
  │
  │ fetch() a través de api.js
  ▼
BACKEND (FastAPI / Python)
  │
  │ Valida con Pydantic
  │ Ejecuta SQL parametrizado
  ▼
BASE DE DATOS (MySQL)
  │
  │ Devuelve filas como diccionarios
  ▼
BACKEND
  │
  │ Serializa a JSON
  ▼
FRONTEND
  │
  │ Renderiza HTML / muestra toast
  ▼
USUARIO ve el resultado
```

---

*Guía elaborada sobre el proyecto TiendaAero — Javier Lanau Gómez, FCT 2024/2025.*
