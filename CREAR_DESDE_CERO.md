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
25. [CI/CD — Despliegue automático en GitHub Pages](#25-cicd--despliegue-automático-en-github-pages)
26. [Diagrama de relaciones de la base de datos](#26-diagrama-de-relaciones-de-la-base-de-datos)
27. [Referencia completa de la API REST](#27-referencia-completa-de-la-api-rest)
28. [Flujo end-to-end: ejemplo crear un pedido](#28-flujo-end-to-end-ejemplo-crear-un-pedido)
29. [Puntos fuertes del proyecto](#29-puntos-fuertes-del-proyecto)
30. [Puntos de mejora](#30-puntos-de-mejora)
31. [Preguntas frecuentes en entrevista técnica](#31-preguntas-frecuentes-en-entrevista-técnica)
32. [Mejora: Dashboard — panel de control visual](#32-mejora-dashboard--panel-de-control-visual)
33. [Mejora: Editar líneas de un pedido](#33-mejora-editar-líneas-de-un-pedido)
34. [Mejora: Alertas de stock bajo](#34-mejora-alertas-de-stock-bajo)

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

## 25. CI/CD — Despliegue automático en GitHub Pages

### ¿Qué es CI/CD?

**CI** significa *Continuous Integration* (Integración Continua). Cada vez que subes código a GitHub, se ejecutan verificaciones automáticas: se instalan las dependencias, se comprueba la sintaxis, se pasan los tests. Si algo falla, te avisa antes de que el error llegue a producción.

**CD** significa *Continuous Deployment* (Despliegue Continuo). Cuando el código pasa las verificaciones, se despliega automáticamente en el servidor o servicio de hosting, sin que tengas que hacerlo a mano.

En TiendaAero el flujo es:
```
git push
    │
    ▼
GitHub Actions ejecuta los checks de CI (ci.yml)
    │
    ├── Si algo falla → te avisa con ✗ en el commit, NO despliega
    │
    └── Si todo pasa → ejecuta el deploy (deploy.yml)
                           │
                           ▼
                  Frontend publicado en GitHub Pages
```

### ¿Qué es GitHub Actions?

GitHub Actions es el sistema de automatización integrado en GitHub. Funciona con ficheros `.yml` que defines dentro de la carpeta `.github/workflows/` de tu repositorio. Cada fichero describe:

- **Cuándo** ejecutarse (`on: push`, `on: pull_request`, manualmente...)
- **Dónde** ejecutarse (una máquina virtual Ubuntu, Windows o Mac proporcionada por GitHub)
- **Qué hacer** paso a paso (descargar el código, instalar dependencias, ejecutar comandos, desplegar...)

GitHub te da **2.000 minutos gratis al mes** en repositorios públicos (prácticamente ilimitado para proyectos personales).

### ¿Qué es GitHub Pages?

GitHub Pages es un servicio gratuito de GitHub que publica ficheros HTML/CSS/JS estáticos como un sitio web accesible desde Internet. La URL sigue el patrón:

```
https://<usuario>.github.io/<repositorio>/
```

Para TiendaAero:
```
https://javierlanaugomez.github.io/TiendaAero/
```

**Limitación importante:** GitHub Pages solo sirve ficheros estáticos. El backend FastAPI **no puede desplegarse aquí** — necesita un servidor que ejecute Python. Para el backend en producción se usaría un servicio como Render, Railway o un VPS. En esta configuración, Pages sirve solo el frontend; el backend seguirá corriendo en local o en otro servidor.

---

### Dónde crear el fichero

El fichero de despliegue vive dentro de la carpeta de workflows de GitHub Actions:

```
TiendaAero/
└── .github/
    └── workflows/
        ├── ci.yml        ← ya existía (verificaciones)
        └── deploy.yml    ← este es el nuevo
```

La carpeta `.github/` es especial: GitHub la lee automáticamente y ejecuta todo lo que encuentre dentro de `workflows/`.

---

### El fichero `deploy.yml` completo y explicado

```yaml
name: Deploy Frontend — GitHub Pages
```
El nombre que aparecerá en la pestaña Actions de GitHub.

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy.yml'
  workflow_dispatch:
```
**¿Cuándo se ejecuta?**
- En cada `push` a la rama `main` **que toque** algún fichero dentro de `frontend/` o el propio `deploy.yml`. Si solo cambias el backend, el deploy no se lanza innecesariamente.
- `workflow_dispatch` → permite lanzarlo a mano desde la web de GitHub (botón "Run workflow" en la pestaña Actions).

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```
**Permisos del workflow.** Por seguridad, GitHub Actions no tiene permisos por defecto. Aquí declaramos exactamente los mínimos necesarios:
- `contents: read` → puede leer el código del repo.
- `pages: write` → puede publicar en GitHub Pages.
- `id-token: write` → necesario para el sistema de autenticación entre Actions y Pages.

```yaml
concurrency:
  group: pages
  cancel-in-progress: true
```
**Evitar despliegues simultáneos.** Si haces dos pushes seguidos muy rápido, el primer deploy se cancela y solo se ejecuta el segundo. Así no hay dos versiones del frontend publicándose a la vez.

```yaml
jobs:
  deploy:
    name: Desplegar en GitHub Pages
    runs-on: ubuntu-latest
```
Define el job llamado `deploy`. Se ejecuta en una máquina virtual Ubuntu que GitHub proporciona gratuitamente.

```yaml
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
```
Vincula el job al entorno "github-pages". Esto hace que GitHub muestre la URL del despliegue directamente en la pestaña Actions y en la página del commit. `${{ steps.deployment.outputs.page_url }}` es una variable que se rellena automáticamente con la URL real al terminar el deploy.

```yaml
    steps:
      - name: Descargar el codigo
        uses: actions/checkout@v4
```
**Paso 1.** Descarga el código del repositorio en la máquina virtual. Sin este paso, la máquina estaría vacía.

```yaml
      - name: Configurar GitHub Pages
        uses: actions/configure-pages@v5
```
**Paso 2.** Prepara la infraestructura de Pages en la máquina virtual (rutas base, configuración interna).

```yaml
      - name: Subir carpeta frontend como artefacto
        uses: actions/upload-pages-artifact@v3
        with:
          path: frontend/
```
**Paso 3.** Comprime y sube la carpeta `frontend/` como un "artefacto" (un paquete temporal almacenado en GitHub). Solo se publica esta carpeta, no el backend ni ningún otro fichero del repo.

```yaml
      - name: Desplegar en GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
**Paso 4.** Coge el artefacto del paso anterior y lo publica en GitHub Pages. Devuelve la URL pública en `steps.deployment.outputs.page_url`.

---

### Qué configurar en GitHub (ya configurado vía API)

Para que el workflow funcione, GitHub Pages debe estar configurado para usar **GitHub Actions** como fuente (en vez de una rama). Esto ya está activado en este repositorio. Si lo hicieras manualmente:

```
GitHub → Repositorio → Settings → Pages
  Source: GitHub Actions   ← seleccionar esto
```

Con la configuración anterior (source = rama `gh-pages`) no funcionaría porque el workflow no genera ninguna rama, sino que despliega directamente.

---

### Flujo completo desde el `git push` hasta el frontend publicado

```
1. Ejecutas:  git add . && git commit -m "..." && git push

2. GitHub recibe el push en la rama main

3. GitHub Actions detecta que hay ficheros de frontend cambiados
   y lanza el workflow deploy.yml en una máquina virtual Ubuntu

4. La máquina virtual ejecuta los 4 pasos:
   ├── Descarga el código (checkout)
   ├── Configura Pages
   ├── Empaqueta frontend/ como artefacto
   └── Publica el artefacto en Pages

5. En ~30-60 segundos el frontend está disponible en:
   https://javierlanaugomez.github.io/TiendaAero/

6. GitHub muestra ✓ verde en el commit y la URL del despliegue
   en la pestaña Actions
```

---

### Preguntas frecuentes en entrevista sobre CI/CD

---

**P: ¿Qué es CI/CD y por qué lo usas en tu proyecto?**

R: CI/CD son las siglas de Integración Continua y Despliegue Continuo. CI significa que cada vez que subo código, se ejecutan verificaciones automáticas: en mi proyecto se comprueba la sintaxis de todos los ficheros Python y que existen todos los ficheros del frontend. CD significa que si todo pasa, el frontend se despliega automáticamente en GitHub Pages sin que yo tenga que hacer nada manual. Lo uso porque es la forma profesional de trabajar: te asegura que nunca subes código roto y que el sitio siempre está actualizado con la última versión.

---

**P: ¿Qué es GitHub Actions?**

R: Es el sistema de automatización integrado en GitHub. Funciona con ficheros YAML dentro de la carpeta `.github/workflows/`. En esos ficheros defines cuándo ejecutarse, en qué tipo de máquina y qué pasos dar. GitHub proporciona las máquinas virtuales gratis. En mi proyecto tengo dos workflows: `ci.yml` que verifica el código, y `deploy.yml` que publica el frontend en GitHub Pages.

---

**P: ¿Qué es GitHub Pages y qué limitaciones tiene?**

R: GitHub Pages es un servicio gratuito de GitHub que publica ficheros estáticos como un sitio web accesible desde Internet. Solo sirve HTML, CSS y JavaScript — no puede ejecutar código de servidor. Por eso en mi proyecto solo el frontend está en GitHub Pages; el backend FastAPI necesita un servidor Python y no puede alojarse ahí. Para producción real, el backend iría en un servicio como Render o Railway.

---

**P: ¿Qué ocurre exactamente desde que haces `git push` hasta que el frontend está publicado?**

R: Primero GitHub recibe el push. Detecta que hay ficheros de `frontend/` modificados y lanza el workflow `deploy.yml` en una máquina virtual Ubuntu. Esa máquina descarga el código, configura Pages, empaqueta la carpeta `frontend/` como artefacto y la publica en GitHub Pages. Todo el proceso tarda entre 30 y 60 segundos. Al terminar, GitHub muestra un tick verde en el commit y la URL del despliegue en la pestaña Actions.

---

## 26. Diagrama de relaciones de la base de datos

Una visión global de cómo se relacionan las cinco tablas entre sí:

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  categorias │         │    productos      │         │  clientes   │
│─────────────│         │──────────────────│         │─────────────│
│ id (PK)     │◄────────│ id (PK)          │         │ id (PK)     │
│ nombre      │  1:N    │ nombre           │         │ nombre      │
│ descripcion │         │ descripcion      │         │ email       │
└─────────────┘         │ precio           │         │ telefono    │
                        │ stock            │         │ direccion   │
                        │ stock_minimo     │         │ fecha_reg.  │
                        │ categoria_id(FK) │         └──────┬──────┘
                        │ marca            │                │ 1
                        │ imagen_url       │                │
                        └────────┬─────────┘                │ N
                                 │                   ┌──────▼──────┐
                                 │ N                 │   pedidos   │
                                 │                   │─────────────│
                        ┌────────▼──────────┐        │ id (PK)     │
                        │  detalle_pedidos  │        │ cliente_id  │
                        │───────────────────│        │ fecha       │
                        │ id (PK)           │        │ estado      │
                        │ pedido_id (FK)    │◄───────│ total       │
                        │ producto_id (FK)  │   1:N  └─────────────┘
                        │ cantidad          │
                        │ precio_unitario   │
                        └───────────────────┘
```

**Relaciones clave:**
- `categorias` → `productos`: una categoría agrupa muchos productos (1:N). La FK `categoria_id` está en `productos`. Con `ON DELETE RESTRICT`: no se puede borrar una categoría que tenga productos.
- `clientes` → `pedidos`: un cliente tiene muchos pedidos (1:N). Con `ON DELETE RESTRICT`: no se puede borrar un cliente con pedidos.
- `pedidos` ↔ `productos`: relación muchos a muchos (N:M) resuelta con la tabla intermedia `detalle_pedidos`.
- `pedidos` → `detalle_pedidos`: con `ON DELETE CASCADE`: si se borra el pedido, sus líneas de detalle se borran automáticamente.
- `productos` → `detalle_pedidos`: con `ON DELETE RESTRICT`: no se puede borrar un producto que haya sido comprado.

**¿Por qué este diseño y no otro?**

- **Normalización 3FN**: no hay datos repetidos. El nombre del cliente no se repite en cada pedido; se guarda el `cliente_id` y se hace JOIN cuando se necesita.
- **Integridad referencial con InnoDB**: las claves foráneas garantizan que no puede existir un pedido sin cliente, ni un detalle sin pedido y sin producto.
- **ENUM para estado**: evita que alguien inserte un estado inválido como `"cancelado"` sin modificar el schema.
- **`utf8mb4`**: el charset más completo de MySQL; soporta emojis y todos los caracteres Unicode, importante para nombres y descripciones en español.
- **`DECIMAL(10,2)` para precios**: nunca uses `FLOAT` para dinero. Los flotantes tienen errores de representación binaria (`0.1 + 0.2 = 0.30000000000000004`). `DECIMAL` es exacto.

---

## 27. Referencia completa de la API REST

### Listado de todos los endpoints

#### Categorías

| Método | Ruta | Qué hace | Recibe | Devuelve |
|--------|------|----------|--------|----------|
| GET | `/categorias` | Lista todas las categorías | — | Array JSON de categorías |
| GET | `/categorias/{id}` | Obtiene una categoría por ID | ID en URL | Objeto JSON de la categoría |
| POST | `/categorias` | Crea una nueva categoría | `{nombre, descripcion?}` | `{id, mensaje}` + HTTP 201 |
| PUT | `/categorias/{id}` | Actualiza campos de una categoría | Campos a cambiar | `{mensaje}` |
| DELETE | `/categorias/{id}` | Elimina una categoría | ID en URL | `{mensaje}` |

#### Productos

| Método | Ruta | Qué hace | Recibe | Devuelve |
|--------|------|----------|--------|----------|
| GET | `/productos` | Lista todos los productos | `?categoria=N` (opcional) | Array JSON de productos |
| GET | `/productos/{id}` | Obtiene un producto | ID en URL | Objeto JSON del producto |
| POST | `/productos` | Crea un producto | `{nombre, precio, categoria_id, ...}` | `{id, mensaje}` + HTTP 201 |
| PUT | `/productos/{id}` | Actualiza un producto | Campos a cambiar | `{mensaje}` |
| DELETE | `/productos/{id}` | Elimina un producto | ID en URL | `{mensaje}` |

#### Clientes

| Método | Ruta | Qué hace | Recibe | Devuelve |
|--------|------|----------|--------|----------|
| GET | `/clientes` | Lista todos los clientes | — | Array JSON de clientes |
| GET | `/clientes/{id}` | Obtiene un cliente | ID en URL | Objeto JSON del cliente |
| POST | `/clientes` | Crea un cliente | `{nombre, email, telefono?, direccion?}` | `{id, mensaje}` + HTTP 201 |
| PUT | `/clientes/{id}` | Actualiza un cliente | Campos a cambiar | `{mensaje}` |
| DELETE | `/clientes/{id}` | Elimina un cliente | ID en URL | `{mensaje}` |

#### Pedidos

| Método | Ruta | Qué hace | Recibe | Devuelve |
|--------|------|----------|--------|----------|
| GET | `/pedidos` | Lista todos los pedidos | — | Array JSON de pedidos |
| GET | `/pedidos/{id}` | Obtiene un pedido con sus líneas | ID en URL | Pedido + array `lineas` |
| POST | `/pedidos` | Crea un pedido (valida stock, descuenta) | `{cliente_id, lineas:[{producto_id, cantidad}]}` | `{id, total, mensaje}` + HTTP 201 |
| PUT | `/pedidos/{id}/estado` | Cambia el estado del pedido | `{estado: "pendiente"\|"enviado"\|"entregado"}` | `{mensaje}` |

#### Autenticación

| Método | Ruta | Qué hace | Recibe | Devuelve |
|--------|------|----------|--------|----------|
| POST | `/auth/login` | Login de usuario | `username` + `password` (form-data) | `{access_token, token_type}` |

#### Raíz

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/` | Mensaje de bienvenida (health check) |

### Buenas prácticas REST aplicadas

- **Verbos HTTP correctos**: GET para leer, POST para crear, PUT para actualizar, DELETE para borrar.
- **Recursos en plural y en minúsculas**: `/categorias`, `/productos`.
- **HTTP 201** al crear recursos en vez del genérico 200.
- **HTTP 404** cuando el recurso no existe.
- **HTTP 400** cuando los datos son inválidos (sin campos para actualizar, stock insuficiente).
- **HTTP 401** cuando el token falta o es inválido (con autenticación JWT activa).
- **Respuestas JSON** siempre consistentes.
- **Parámetro de query** para filtrar: `GET /productos?categoria=3` en vez de `GET /productos/categoria/3`.
- **Subruta para acción específica**: `PUT /pedidos/{id}/estado` deja claro que solo el estado es modificable.

---

## 28. Flujo end-to-end: ejemplo crear un pedido

Este ejemplo recorre todo el sistema de arriba a abajo, desde el clic del usuario hasta la respuesta en pantalla.

**Paso 1 — El usuario navega a Pedidos**
- Hace clic en "Pedidos" en el sidebar.
- El navegador cambia la URL a `index.html#pedidos`.
- Se dispara el evento `hashchange` → `app.js::navegarA('pedidos')`.
- Se muestra la sección `#sec-pedidos` y se ocultan las demás.
- Se llama a `pedidos.js::cargarPedidos()`.

**Paso 2 — Se cargan los pedidos**
- `cargarPedidos()` llama a `api.js::obtenerDatos('/pedidos')`.
- `fetch('http://127.0.0.1:8000/pedidos')` sale del navegador.
- El backend recibe `GET /pedidos`, ejecuta `SELECT * FROM pedidos`, devuelve el array JSON.
- La tabla se renderiza en el DOM.

**Paso 3 — El usuario abre el formulario**
- Hace clic en "+ Nuevo pedido".
- `pedidos.js::abrirFormPedido()` comprueba si ya hay clientes y productos en caché.
- Si no, hace `GET /clientes` y `GET /productos` para llenar los desplegables.
- `app.js::abrirModal()` inserta el HTML del formulario y lo hace visible.
- `agregarLineaPedido()` añade automáticamente la primera línea.

**Paso 4 — El usuario selecciona productos**
- Selecciona un cliente del desplegable.
- En la línea 1, selecciona "DJI Mini 4 Pro" y cantidad 1.
- Cada cambio dispara `recalcularTotal()`:
  - Busca el producto en `_productos` (caché local, sin petición al backend).
  - Suma `precio × cantidad` para cada línea.
  - Actualiza el texto `<span id="total-estimado">759.00</span>`.

**Paso 5 — El usuario hace clic en "Crear pedido"**
- El evento `submit` del formulario llama a `guardarPedido(evento)`.
- `evento.preventDefault()` evita que la página se recargue.
- Se recogen las líneas del DOM: `[{producto_id: 6, cantidad: 1}]`.
- Se llama a `enviarDatos('/pedidos', {cliente_id: 2, lineas: [...]})`.

**Paso 6 — El backend procesa el pedido**
- FastAPI recibe `POST /pedidos` con el JSON.
- Pydantic valida la estructura.
- `pedidos.py::crear_pedido()` ejecuta en fases:
  1. `SELECT precio, stock FROM productos WHERE id = 6` → precio=759.00, stock=6.
  2. Comprueba: `6 >= 1` → OK.
  3. Calcula total: `759.00 × 1 = 759.00`.
  4. `INSERT INTO pedidos (cliente_id, total) VALUES (2, 759.00)` → nuevo_id=4.
  5. `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (4, 6, 1, 759.00)`.
  6. `UPDATE productos SET stock = stock - 1 WHERE id = 6` → stock queda en 5.
  7. `conexion.commit()` — todo es atómico: si algo falla antes del commit, nada se guarda.
- Devuelve: `{"id": 4, "total": 759.0, "mensaje": "Pedido creado"}` con HTTP 201.

**Paso 7 — El frontend recibe la respuesta**
- `api.js` recibe el JSON.
- `pedidos.js` muestra: `mostrarToast("Pedido creado — Total: 759.00 €")`.
- Cierra el modal.
- Refresca `_productos` para actualizar el stock en caché.
- Llama a `cargarPedidos()` para que el nuevo pedido aparezca en la tabla.

**¿Qué pasaría si hay stock insuficiente?**
- El backend haría `raise HTTPException(status_code=400, detail="Stock insuficiente para el producto 6...")`.
- `api.js` detecta que `respuesta.ok === false` y lanza `throw new Error("Stock insuficiente...")`.
- `pedidos.js` captura el error en el `catch` y llama a `mostrarToast("Stock insuficiente...", "error")`.
- El toast se muestra en rojo. No se cierra el modal. El usuario puede corregir la cantidad.

---

## 29. Puntos fuertes del proyecto

**Separación clara de responsabilidades**
Cada entidad tiene su propio fichero JS. El código de productos no mezcla lógica de clientes. Si hay un bug en la gestión de pedidos, sabes exactamente dónde buscar.

**Capa de abstracción sobre fetch (`api.js`)**
Las cuatro funciones (`obtenerDatos`, `enviarDatos`, `modificarDatos`, `borrarDatos`) centralizan el manejo de errores y las cabeceras HTTP. Si mañana necesitas añadir un token de autorización a todas las peticiones, lo añades en un solo sitio.

**Modelos Pydantic para validación automática**
FastAPI + Pydantic valida los datos de entrada sin código manual. Si llega un JSON malformado, el backend responde con HTTP 422 y un mensaje claro del campo que falla.

**Snapshot del precio en pedidos**
El campo `precio_unitario` en `detalle_pedidos` guarda el precio en el momento de la compra. Si el precio del producto cambia, el histórico de pedidos sigue siendo correcto. Esta es una decisión de diseño madura que imita el comportamiento de sistemas reales (Amazon, tiendas online).

**Transacción atómica al crear pedidos**
La verificación de stock, la inserción del pedido, las líneas y el descuento de stock ocurren en una sola transacción. O todo se guarda o nada. Esto evita inconsistencias en la base de datos.

**Navegación SPA con hash**
La aplicación no recarga la página al navegar, lo que da una experiencia más fluida. El hash en la URL permite que el botón "atrás" del navegador funcione y que puedas compartir la URL de una sección concreta.

**Total calculado en tiempo real**
El formulario de pedidos actualiza el total estimado conforme el usuario selecciona productos y cantidades, mejorando la experiencia de usuario sin ninguna petición adicional al backend.

**Variables de entorno para configuración sensible**
Las credenciales de base de datos nunca están en el código. El `.env.example` sirve como guía para otros desarrolladores.

**Autenticación JWT completa**
Login con contraseña hasheada (bcrypt), token firmado (HS256), protección de endpoints con `Depends`, expiración configurable y gestión de sesión en el frontend con `localStorage`.

---

## 30. Puntos de mejora

### Sin pool de conexiones (rendimiento)
Cada petición HTTP abre y cierra una conexión a MySQL. Con concurrencia alta, esto es un cuello de botella. La solución es usar **SQLAlchemy** con su pool de conexiones integrado, o configurar `mysql-connector-python` en modo pool.

### Tests automatizados
No hay tests automatizados. Añadir tests con `pytest` + `TestClient` de FastAPI aseguraría que los cambios futuros no rompen la funcionalidad existente. El siguiente paso sería:
```python
from fastapi.testclient import TestClient
from main import aplicacion

cliente = TestClient(aplicacion)

def test_listar_categorias():
    respuesta = cliente.get("/categorias")
    assert respuesta.status_code == 200
    assert isinstance(respuesta.json(), list)
```

### CORS demasiado permisivo
`allow_methods=["*"]` y `allow_headers=["*"]` deberían restringirse en producción a solo los métodos y cabeceras necesarios. Con autenticación activa, hay que añadir también `allow_credentials=True`.

### Sin paginación en los listados
`GET /productos` devuelve todos los productos. Con miles de registros sería muy lento. Se debería añadir: `GET /productos?pagina=1&tamanio=20`, que en SQL se traduce a `LIMIT 20 OFFSET 0`.

### Sin validación de email
El backend acepta cualquier string como email. Pydantic tiene `EmailStr` (del paquete `pydantic[email]`) que valida el formato automáticamente. Solo hay que cambiar `email: str` por `email: EmailStr`.

### El frontend usa `innerHTML` con datos del servidor (riesgo XSS)
En varios módulos se inserta directamente el nombre del cliente/producto en el HTML sin sanitizar. Si un nombre contuviera `<script>alert('xss')</script>`, podría ejecutarse código malicioso. La solución es usar `textContent` para datos externos, o sanitizar con `DOMPurify`.

### Sin manejo de errores de conexión personalizados
Si la base de datos no está disponible, el usuario ve un error genérico HTTP 500. Sería mejor capturar `mysql.connector.Error` y devolver HTTP 503 (Service Unavailable) con un mensaje claro.

### Formulario de actualización abre siempre vacío
Al editar un registro, el formulario debería prerrellenar los valores actuales. Actualmente hay que volver a escribir todos los campos.

### Race condition en el stock
Si dos usuarios compraran el último producto al mismo tiempo, ambas peticiones podrían pasar la validación de stock y decrementarlo a -1. La solución correcta es `SELECT ... FOR UPDATE` para bloquear la fila durante la transacción.

---

## 31. Preguntas frecuentes en entrevista técnica

Las preguntas de CI/CD están en la sección 25. Aquí se recogen el resto de preguntas técnicas habituales sobre la arquitectura del proyecto.

---

**P: ¿Qué es una API REST y por qué la has implementado así?**

R: Una API REST es una interfaz de comunicación entre sistemas que sigue unas convenciones: usa los verbos HTTP para indicar la acción (GET=leer, POST=crear, PUT=actualizar, DELETE=borrar), organiza los recursos en URLs jerárquicas (como `/categorias`, `/categorias/5`) y devuelve JSON como formato de intercambio. La he implementado así porque es el estándar de la industria para comunicar frontends con backends, es stateless (el servidor no guarda el estado de la sesión) y cualquier cliente (navegador, app móvil, Postman) puede consumirla.

---

**P: ¿Qué es CORS y por qué lo necesitas?**

R: CORS es un mecanismo de seguridad de los navegadores que impide que JavaScript haga peticiones a un dominio/puerto diferente al que sirvió la página. En mi proyecto el frontend se sirve desde el puerto 5500 y el backend está en el 8000, por eso el navegador bloquea las peticiones. Configuro `CORSMiddleware` en FastAPI para añadir la cabecera `Access-Control-Allow-Origin` en las respuestas, diciéndole al navegador que esos orígenes están permitidos. Es importante que CORS solo es una restricción del navegador; herramientas como Postman o curl pueden llamar al backend sin problemas aunque CORS esté mal configurado.

---

**P: ¿Qué es Pydantic y para qué lo usas?**

R: Pydantic es una librería de validación de datos basada en los type hints de Python. En FastAPI, defino clases que heredan de `BaseModel` y describen la estructura del JSON que espero recibir. FastAPI usa Pydantic para validar automáticamente cada petición: si falta un campo obligatorio o llega con el tipo incorrecto, responde con HTTP 422 y un mensaje de error descriptivo sin que yo escriba ni una línea de validación manual.

---

**P: ¿Por qué guardas `precio_unitario` en `detalle_pedidos` en lugar de usar el precio del producto?**

R: Porque el precio de un producto puede cambiar en el futuro. Si mañana el DJI Mini 4 Pro sube de precio y yo solo guardara el `producto_id`, al consultar un pedido antiguo mostraría el precio nuevo en vez del precio que pagó el cliente. Guardar el `precio_unitario` en el momento de la compra es un snapshot histórico que garantiza que el historial de pedidos siempre sea correcto.

---

**P: ¿Por qué el frontend no tiene React ni ningún framework?**

R: Para un proyecto de este tamaño (cuatro secciones CRUD con una sola persona trabajando), usar un framework sería sobreingeniería. React o Vue añaden complejidad de configuración (webpack, node_modules, babel) que no aporta valor real aquí. Vanilla JS demuestra que entiendo los fundamentos: manipulación del DOM, eventos, async/await, fetch. Además, el frontend se puede abrir directamente en el navegador sin ningún proceso de compilación.

---

**P: ¿Qué pasaría si dos usuarios compraran el último producto al mismo tiempo?**

R: Es una condición de carrera (race condition). En la implementación actual, existe el riesgo de que ambas peticiones comprueben el stock simultáneamente, vean que hay 1 unidad disponible, ambas pasen la validación y ambas decrementen el stock, quedando en -1. La solución correcta sería usar una transacción con bloqueo: `SELECT ... FOR UPDATE` bloquea la fila del producto durante la transacción, haciendo que la segunda petición espere a que la primera confirme o aborte. Esto es un punto de mejora real para producción.

---

**P: ¿Por qué en el PUT de actualización construyes el SQL dinámicamente?**

R: Porque quiero que el cliente solo envíe los campos que quiere cambiar, sin tener que mandar todos. Si recibo `{precio: 199.99}`, solo actualizo el precio, no toco el nombre ni el stock. El código recorre los campos no nulos del modelo Pydantic (`{k: v for k, v in datos.model_dump().items() if v is not None}`) y construye el `UPDATE ... SET campo1 = ?, campo2 = ?` dinámicamente. Los valores siempre se pasan como parámetros (`%s`), nunca concatenados en el string SQL, por lo que no hay riesgo de SQL injection.

---

**P: ¿Qué es una inyección SQL y cómo la evitas?**

R: La inyección SQL ocurre cuando un atacante mete código SQL dentro de un dato de entrada para manipular la consulta. Por ejemplo, si el `id` de una URL se concatenara directamente: `"SELECT * FROM productos WHERE id = " + id`, un atacante podría poner `id = "1 OR 1=1"` y obtener todos los productos. En mi proyecto evito esto usando **consultas parametrizadas** (`%s`): el valor siempre se pasa por separado del SQL (`cursor.execute("SELECT * FROM productos WHERE id = %s", (id,))`), por lo que el conector MySQL trata el valor como dato, nunca como código SQL.

---

**P: ¿Por qué no usas un ORM como SQLAlchemy?**

R: He optado por SQL directo (con `mysql-connector-python`) para tener control total sobre las consultas y para entender exactamente qué se está ejecutando en la base de datos. Un ORM como SQLAlchemy abstrae el SQL, lo cual facilita el desarrollo pero puede generar consultas ineficientes si no se configura bien. Para un proyecto educativo, escribir SQL a mano también demuestra que dominas el lenguaje de bases de datos. Dicho esto, en un proyecto de producción usaría SQLAlchemy por su pool de conexiones, migraciones con Alembic y productividad a largo plazo.

---

**P: ¿Cómo desplegarías este proyecto en producción?**

R: Para el backend, empaquetaría la aplicación en un contenedor **Docker** y la desplegaría en un servicio cloud (AWS, Azure, Render...) con `uvicorn` como servidor ASGI. La base de datos iría en un servicio gestionado (Amazon RDS, PlanetScale) en lugar de un MySQL local. Para el frontend, como son ficheros estáticos (HTML/CSS/JS), los subiría a un CDN o a un servicio como Netlify/Vercel (o GitHub Pages, como ya está configurado). Actualizaría `API_URL` en `config.js` con la URL real del backend. Añadiría variables de entorno en el panel de configuración del proveedor cloud (no con `.env` en producción).

---

**P: ¿Qué añadirías si tuvieras más tiempo?**

R: Por orden de prioridad:

**1. Tests automatizados con pytest**

Los tests evitan que al añadir una función nueva rompas algo que ya funcionaba (regresiones). Con `pytest` + el `TestClient` de FastAPI puedes hacer peticiones HTTP reales contra la aplicación sin arrancar ningún servidor. Yo empezaría por los flujos críticos: crear pedido con stock suficiente, crear pedido sin stock (debe devolver 400), e intentar borrar una categoría con productos asociados.

**2. Paginación en los listados**

`GET /productos` devuelve todos los productos de golpe. Con miles de registros la respuesta sería enorme y lenta. La solución es añadir parámetros: `GET /productos?pagina=1&tamanio=20`. En SQL se traduce a `LIMIT 20 OFFSET 0`. La respuesta devolvería los 20 productos más metadatos: `{"datos": [...], "total": 10000, "pagina": 1, "paginas": 500}`.

**3. Pool de conexiones con SQLAlchemy**

Actualmente cada petición HTTP abre una conexión nueva a MySQL y la cierra al terminar. Abrir una conexión cuesta tiempo (handshake TCP, autenticación). Un **connection pool** mantiene un número de conexiones abiertas y las reutiliza, eliminando ese coste en cada petición.

**4. Validación de email con `pydantic[email]`**

Solo hay que cambiar `email: str` por `email: EmailStr` en el modelo Pydantic y ya se devuelve HTTP 422 si el email no tiene formato válido, sin escribir ninguna expresión regular.

**5. Gestión de imágenes (subida al servidor)**

Ahora los productos tienen un campo `imagen_url` que apunta a una URL externa. Añadiría un endpoint `POST /productos/{id}/imagen` que recibe un archivo de imagen con `multipart/form-data` y lo guarda en el servidor (o en AWS S3), guardando la URL resultante en la base de datos.

**6. Sistema de búsqueda de productos**

Añadiría parámetros de búsqueda: `GET /productos?nombre=dji&marca=dji`. En SQL se traduciría a `WHERE nombre LIKE '%dji%' OR marca LIKE '%dji%'`. Para búsquedas más avanzadas se podría integrar el índice `FULLTEXT` de MySQL.

---

## Registro de nuevos usuarios desde la pantalla de login

### ¿Qué se añadió y por qué?

Al arrancar la aplicación por primera vez solo existía el formulario de login. Si un nuevo empleado quería acceder, alguien tenía que crearle la cuenta manualmente desde la base de datos o con el script `crear_admin.py`. Se añadió la posibilidad de registrarse directamente desde la pantalla de login sin tocar la base de datos a mano.

---

### Cambios en el backend

**`backend/routers/autenticacion.py`**

Se añadió un segundo endpoint en el mismo router de autenticación:

```python
class DatosRegistro(BaseModel):
    nombre_usuario: str
    contrasena: str

@enrutador.post("/registro", status_code=201)
def registro(datos: DatosRegistro):
    ...
```

El endpoint:
1. Valida que usuario y contraseña no estén vacíos.
2. Consulta la tabla `usuarios` para comprobar que el nombre no esté ya registrado — devuelve HTTP 409 si ya existe.
3. Hashea la contraseña con bcrypt (usando la misma función `hashear_contrasena` que ya existía en `auth.py`).
4. Inserta el nuevo registro en la tabla `usuarios`.
5. Devuelve HTTP 201 con `{"mensaje": "Usuario creado correctamente"}`.

El endpoint **no requiere token** porque es público: es el punto de entrada para alguien que aún no tiene credenciales.

---

**`backend/requirements.txt`**

Se fijó la versión de bcrypt a `4.0.1`:

```
bcrypt==4.0.1
```

**Por qué:** `passlib 1.7.4` (la librería que gestiona el hashing) no es compatible con `bcrypt >= 5.0.0`. Sin fijar la versión, `pip install` instala la última (`5.x`) y el hasheo de contraseñas falla con un `Internal Server Error` silencioso. Al pinear `bcrypt==4.0.1` en `requirements.txt` cualquier instalación nueva queda en la versión correcta.

---

### Tabla `usuarios` en MySQL

La tabla estaba definida en `database.sql` pero no se había creado en la base de datos. Se creó con:

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id               INT          NOT NULL AUTO_INCREMENT,
    nombre_usuario   VARCHAR(50)  NOT NULL,
    contrasena_hash  VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_nombre (nombre_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

El campo `contrasena_hash` almacena el resultado de bcrypt, nunca la contraseña en texto plano. La clave única `uq_usuarios_nombre` garantiza a nivel de base de datos que no puede existir dos veces el mismo nombre de usuario, incluso si el código fallara en comprobarlo.

---

### Cambios en el frontend

**`frontend/index.html`**

La pantalla de login pasó de tener un único formulario a tener dos paneles dentro de la misma caja:

- `#panel-login` — el formulario de siempre.
- `#panel-registro` — formulario nuevo con los campos: usuario, contraseña y repetir contraseña.

Un enlace al pie de cada panel alterna entre uno y otro.

**`frontend/js/auth.js`**

Se añadieron tres funciones:

- `mostrarLogin()` — muestra el panel de login y oculta el de registro, limpiando los campos.
- `mostrarRegistro()` — lo contrario.
- `enviarRegistro(evento)` — recoge los datos del formulario, comprueba que las dos contraseñas coinciden antes de hacer ninguna petición, llama a `POST /auth/registro` con JSON, y si la respuesta es correcta espera 1,5 segundos y redirige automáticamente al panel de login para que el usuario pueda entrar.

**`frontend/css/estilos.css`**

Se añadieron dos clases nuevas:

- `.login-exito` — texto verde para el mensaje de confirmación tras un registro correcto.
- `.login-cambio` — estilo del enlace "¿No tienes cuenta? Crear cuenta" al pie del formulario.

---

### Flujo completo de registro

```
Usuario abre la app
  → ve el formulario de login
  → hace clic en "Crear cuenta"
  → rellena usuario, contraseña y confirmación
  → hace clic en "Registrarse"
    → si las contraseñas no coinciden: error en pantalla, sin petición al servidor
    → si el usuario ya existe: el servidor devuelve 409 y se muestra el error
    → si todo va bien: el servidor devuelve 201, aparece "Usuario creado. Ahora puedes iniciar sesión."
      → tras 1,5 s se vuelve al panel de login automáticamente
```

---

*Documento generado a partir del análisis del código fuente del proyecto TiendaAero — Javier Lanau Gómez, FCT 2024/2025.*

---

## 32. Mejora: Dashboard — panel de control visual

### ¿Qué es y para qué sirve?

El dashboard es la pantalla principal que ven los usuarios nada más iniciar sesión. Su objetivo es que el gestor de la tienda pueda leer el estado del negocio **de un solo vistazo**, sin tener que navegar a otras secciones.

La versión inicial mostraba 4 tarjetas estáticas con totales históricos. Esta mejora lo convierte en un cuadro de mando real con métricas diarias, comparativas de tendencia, ranking de productos y un diseño visual diferenciado.

---

### Endpoint `GET /dashboard` — campos nuevos

El endpoint ya existía. Se amplía para devolver métricas temporales (hoy, semana, mes) además de los totales históricos.

**¿Por qué un único endpoint y no varios?**
- Evita múltiples peticiones en paralelo al cargar la página.
- La lógica de agregación (`SUM`, `AVG`, `GROUP BY`, `JOIN`) pertenece al backend.
- Es más sencillo añadir caché en el futuro si el dashboard carga lento.

**¿Por qué `float()` explícito en el return?**
Las funciones `SUM()`, `AVG()` y `ROUND()` de MySQL devuelven objetos Python de tipo `Decimal`, que no son serializables a JSON por defecto. Se convierten con `float()` antes de retornar.

La respuesta completa del endpoint tiene esta forma:

```python
return {
    # ── Totales históricos (todo el período) ──────────────
    "total_pedidos":        3,
    "total_ventas":         1619.59,
    "total_clientes":       4,
    "total_productos":      12,

    # ── Caja diaria ───────────────────────────────────────
    "pedidos_hoy":          0,       # COUNT(*) WHERE fecha = CURDATE()
    "ventas_hoy":           0.0,     # SUM(total) WHERE fecha = CURDATE()

    # ── Comparativa día anterior ──────────────────────────
    "pedidos_ayer":         0,
    "ventas_ayer":          0.0,

    # ── Semana actual y anterior ──────────────────────────
    "ventas_semana":        0.0,     # YEARWEEK(fecha, 1) = semana actual
    "ventas_semana_anterior": 0.0,

    # ── Mes actual y anterior ─────────────────────────────
    "ventas_mes_actual":    0.0,
    "ventas_mes_anterior":  0.0,

    # ── Ticket medio (promedio por pedido) ────────────────
    "ticket_medio_hoy":     0.0,     # AVG(total) WHERE fecha = CURDATE()
    "ticket_medio_ayer":    0.0,

    # ── Stock, gráfica y ranking ──────────────────────────
    "stock_bajo":       [...],       # stock <= stock_minimo, ORDER BY stock ASC
    "ventas_por_mes":   [...],       # DATE_FORMAT(fecha,'%Y-%m'), últimos 6 meses
    "top_productos":    [...],       # ahora incluye importe_generado además de unidades
}
```

Las nuevas consultas SQL relevantes:

```sql
-- Ticket medio: se usan dos CASE en una sola consulta para evitar una
-- segunda ida a la BD. AVG ignora los NULL que produce el CASE no cumplido.
SELECT
    ROUND(COALESCE(AVG(CASE WHEN fecha = CURDATE()
                       THEN total END), 0), 2) AS ticket_hoy,
    ROUND(COALESCE(AVG(CASE WHEN fecha = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
                       THEN total END), 0), 2) AS ticket_ayer
FROM pedidos
WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 1 DAY);

-- Top 5 productos: se añade importe_generado (cantidad × precio_unitario)
SELECT p.nombre,
       SUM(dp.cantidad) AS unidades_vendidas,
       ROUND(SUM(dp.cantidad * dp.precio_unitario), 2) AS importe_generado
FROM detalle_pedidos dp
JOIN productos p ON p.id = dp.producto_id
GROUP BY dp.producto_id, p.nombre
ORDER BY unidades_vendidas DESC
LIMIT 5;
```

**¿Por qué `YEARWEEK(fecha, 1)`?** El segundo argumento `1` indica que la semana empieza en lunes (norma ISO), que es lo habitual en España. Sin este argumento la semana empieza en domingo.

---

### `frontend/js/dashboard.js` — estructura de funciones

```
cargarDashboard()
  └─ obtenerDatos('/dashboard')
       └─ renderizarDashboard(datos)
            ├─ _tendenciaHTML(actual, anterior, texto)
            │    └─ _calcularTendencia(actual, anterior)
            └─ _dibujarGrafica(ventasPorMes)
```

#### `_calcularTendencia(actual, anterior)`

Compara dos valores y devuelve dirección y porcentaje de variación.

```javascript
function _calcularTendencia(actual, anterior) {
    if (anterior === 0) {
        return actual > 0
            ? { pct: '100.0', direccion: 'up' }
            : { pct: '0.0',   direccion: 'flat' };
    }
    const diff = ((actual - anterior) / anterior) * 100;
    return {
        pct: Math.abs(diff).toFixed(1),
        direccion: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat',
    };
}
```

**¿Por qué el umbral de ±0.5 % en lugar de exactamente 0?** Para evitar que pequeñas diferencias de céntimos (0.01 €) muestren una flecha de tendencia que en realidad no es significativa.

#### `_tendenciaHTML(actual, anterior, textoComp)`

Genera el HTML del indicador de tendencia. Recibe los dos valores a comparar y un texto descriptivo del período ("vs. ayer", "vs. sem. ant.", etc.).

```javascript
// Resultado: <span class="kpi-tendencia tendencia-sube">↑ +12.5% vs. ayer</span>
function _tendenciaHTML(actual, anterior, textoComp) { ... }
```

| Dirección | Clase CSS | Color | Flecha |
|-----------|-----------|-------|--------|
| Subida (> +0.5 %) | `.tendencia-sube` | Verde (`--color-exito`) | ↑ |
| Bajada (< -0.5 %) | `.tendencia-baja` | Rojo (`--color-peligro`) | ↓ |
| Sin cambio | `.tendencia-igual` | Gris (`--texto-suave`) | → |

#### `_dibujarGrafica(ventasPorMes)`

Instancia un `Chart` de tipo `bar` con Chart.js. Antes de crear una instancia nueva destruye la anterior (`_graficaVentas.destroy()`). Sin esto, cada vez que el usuario navega y vuelve al dashboard se acumulan capas invisibles sobre el mismo `<canvas>` y los eventos del ratón dejan de responder correctamente.

**Chart.js** se carga desde CDN en `index.html` antes que los scripts propios:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

---

### Componentes visuales — `frontend/css/estilos.css`

La sección `DASHBOARD` del CSS se reescribió completa. Los componentes nuevos son:

#### `.kpi-hero` — Caja diaria

La tarjeta más prominente del dashboard. Ocupa todo el ancho y tiene un fondo con degradado oscuro (`linear-gradient`) para diferenciarse visualmente del resto de tarjetas blancas.

```css
.kpi-hero {
    background: linear-gradient(135deg, #0f3460 0%, #16213e 55%, #0d5c36 100%);
    color: #ffffff;
    border-radius: 12px;
    padding: 28px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4px 20px rgba(15, 52, 96, 0.4);
}
```

La "caja" se considera **abierta** si `pedidos_hoy > 0`. Como `pedidos.fecha` es de tipo `DATE` (no `DATETIME`), no es posible recuperar la hora exacta del primer pedido del día. Si en el futuro se añade una columna `created_at DATETIME DEFAULT NOW()`, se podría mostrar con `MIN(created_at) WHERE DATE(created_at) = CURDATE()`.

Los estados de caja usan dos clases:

```css
.caja-abierta { background: rgba(22, 163, 74, 0.2); color: #86efac; } /* verde */
.caja-cerrada { background: rgba(239, 68, 68, 0.18); color: #fca5a5; } /* rojo */
```

#### `.kpi-metricas` — Grid de 5 tarjetas

Cinco tarjetas en un grid responsivo. Cada una tiene un borde superior de color diferente (aplicado con `style` inline en el JS) para diferenciarlas visualmente de un golpe de vista.

```css
.kpi-metricas {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
}
```

| Tarjeta | Color del borde |
|---------|----------------|
| Ventas hoy | `#3b82f6` (azul) |
| Ventas semana | `#8b5cf6` (violeta) |
| Ventas mes | `#f59e0b` (ámbar) |
| Ticket medio | `#10b981` (verde) |
| Pedidos hoy | `#ef4444` (rojo) |

**¿Por qué el color en `style` inline y no en una clase CSS?** Porque cada tarjeta necesita un color diferente. Definir cinco clases `.kpi-metrica--azul`, `.kpi-metrica--violeta`... sería más verboso sin ninguna ventaja real para un caso tan puntual.

#### `.top-producto-barra-fill` — Barra de progreso relativa

La barra del producto #1 ocupa siempre el 100 %. El resto se calcula proporcionalmente:

```javascript
const maxUnidades = datos.top_productos[0].unidades_vendidas;
const pct = Math.round((p.unidades_vendidas / maxUnidades) * 100);
// → style="width: 75%"
```

**¿Por qué relativo al #1 y no al total de unidades vendidas?** Porque el objetivo es mostrar la diferencia entre productos, no la cuota de mercado. Si el #1 tiene 100 unidades y el #2 tiene 90, tiene más sentido ver la barra del #2 casi llena que ver ambas prácticamente vacías porque el total es 10.000.

#### Responsividad

```css
@media (max-width: 1200px) { .kpi-metricas { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px)  { .kpi-metricas { grid-template-columns: repeat(2, 1fr); }
                              .dashboard-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px)  { .kpi-metricas { grid-template-columns: 1fr; } }
```

---

### Cambios en `index.html` y `app.js`

Estos ficheros no cambian con esta mejora: la sección `<section id="sec-dashboard">` y la entrada en el nav ya existían desde la primera versión del dashboard. Solo cambia lo que se renderiza dentro del contenedor `#dashboard-contenido`.

---

### Cómo extender el dashboard en el futuro

| Idea | Qué tocar |
|------|-----------|
| Añadir un KPI nuevo | 1 consulta SQL en `dashboard.py`, 1 campo en el `return`, 1 `.kpi-metrica` en `dashboard.js` |
| Selector de período (hoy / semana / mes) | Convertir el endpoint en `GET /dashboard?periodo=semana` y parametrizar los `WHERE` |
| Objetivo diario de ventas | Tabla `configuracion` con el objetivo; barra de progreso en `.kpi-hero` con `(ventas_hoy / objetivo) * 100` |
| Hora de apertura de caja | Añadir `created_at DATETIME DEFAULT NOW()` a `pedidos`; usar `MIN(created_at)` en la consulta |
| Caché del dashboard | `@functools.lru_cache` en el endpoint o tabla de resumen precalculado con un cronjob |

---

## 33. Mejora: Editar líneas de un pedido

### El problema

Al crear un pedido se descuenta stock. Si hay un error en las cantidades no había forma de corregirlo: habría que borrar el pedido y crearlo de nuevo.

### Nuevo endpoint: `PUT /pedidos/{id}/lineas`

Se añade en `backend/routers/pedidos.py`. Recibe `{ "lineas": [...] }` con la nueva lista completa de líneas y realiza la **reconciliación de stock** en una sola transacción:

```
1. Verificar que el pedido existe.
2. Leer las líneas actuales de detalle_pedidos.
3. Devolver el stock de esas líneas (UPDATE productos SET stock = stock + cantidad).
4. Borrar las líneas actuales (DELETE FROM detalle_pedidos WHERE pedido_id = id).
5. Para cada nueva línea: validar stock disponible (tras la devolución del paso 3).
6. Insertar las nuevas líneas y descontar su stock.
7. Recalcular el total y actualizar pedidos.total.
8. COMMIT — si en el paso 5 hay stock insuficiente, se hace ROLLBACK.
```

La clave del diseño es el **orden**: primero se devuelve el stock antiguo y luego se valida el nuevo. Sin este orden, editar una línea para pedir menos unidades del mismo producto fallaría injustamente porque el stock "disponible" no incluiría el que ya estaba reservado por ese pedido.

**Modelo Pydantic:**
```python
class LineasPedido(BaseModel):
    lineas: list[LineaPedido]
```

Reutiliza `LineaPedido` ya existente (`producto_id` + `cantidad`).

### Cambios en el frontend

**`pedidos.js`**

- Se añade el botón "Editar lineas" junto al botón "Ver" en cada fila de la tabla.
- **`editarPedido(id)`** — obtiene el pedido con sus líneas (`GET /pedidos/{id}`), abre un modal con el mismo formulario de líneas que "Nuevo pedido" pero pre-rellenado. El cliente aparece en un `<select disabled>` (no se puede cambiar el cliente de un pedido ya creado).
- **`guardarEdicionPedido(evento, id)`** — recoge las líneas del formulario y llama a `PUT /pedidos/{id}/lineas`. Tras el éxito recarga `_productos` para reflejar los cambios de stock y actualiza el badge del nav.

---

## 34. Mejora: Alertas de stock bajo

### Qué se muestra y dónde

Hay tres puntos de visibilidad para las alertas de stock:

| Lugar | Qué muestra | Cuándo se actualiza |
|---|---|---|
| Badge rojo en nav "Productos" | Número de productos con stock bajo o agotado | Al cargar productos o al crear/editar un pedido |
| Banner rojo en el Dashboard | Aviso con enlace directo a Productos | Al cargar el dashboard |
| Tarjeta KPI "Stock bajo" | El mismo número, con borde rojo | Al cargar el dashboard |
| Tabla inferior del dashboard | Lista completa de productos con stock, stock_minimo y marca | Al cargar el dashboard |

### Criterio de "stock bajo"

Un producto se considera en stock bajo cuando `stock <= stock_minimo`. Este campo existe en la tabla `productos` desde el diseño inicial de la base de datos. La consulta SQL es:

```sql
SELECT id, nombre, stock, stock_minimo, marca
FROM productos
WHERE stock <= stock_minimo
ORDER BY stock ASC
```

El orden `ASC` pone primero los más críticos (los que tienen menos stock).

### Implementación del badge

La función `actualizarBadgeStock(cantidad)` está en `dashboard.js` (cargado antes que los demás módulos). Muestra u oculta el elemento `#badge-stock` del nav según si hay productos afectados.

Se llama desde tres puntos:
- `cargarDashboard()` — con el dato que devuelve la API.
- `cargarProductos()` — filtrando `_productos` en cliente: `_productos.filter(p => p.stock <= p.stock_minimo).length`.
- `guardarPedido()` y `guardarEdicionPedido()` — tras recargar `_productos` porque crear/editar un pedido modifica el stock.

### CSS: `.badge-nav`

Un `<span>` pequeño de fondo rojo situado dentro del enlace del nav. Usa `border-radius: 99px` para ser circular con cualquier número de dígitos. Tiene clase `.oculta` por defecto y se muestra solo cuando `cantidad > 0`.

---

**P: ¿Por qué el `deploy.yml` tiene `paths: frontend/**`?**

R: Para que el workflow de despliegue solo se lance cuando realmente cambia algo del frontend. Si modifico el backend (Python, SQL) o la documentación, no tiene sentido volver a desplegar el frontend porque no ha cambiado nada. Esto ahorra tiempo y minutos de Actions.

---

**P: ¿Qué es `concurrency` en el workflow?**

R: Es una configuración que evita despliegues simultáneos. Si hago dos commits muy seguidos, el primer deploy se cancela y solo se ejecuta el segundo. Sin esto podrían estar dos versiones del frontend publicándose a la vez y causar un estado inconsistente en Pages.

---

**P: ¿Por qué necesitas declarar `permissions` en el workflow?**

R: Por seguridad. GitHub Actions por defecto tiene permisos mínimos. Si no declaras explícitamente qué permisos necesita el workflow, no podrá escribir en GitHub Pages aunque quieras que lo haga. Declararlos explícitamente también hace que cualquiera que lea el fichero entienda exactamente qué puede y qué no puede hacer ese workflow.

---

*Guía elaborada sobre el proyecto TiendaAero — Javier Lanau Gómez, FCT 2024/2025.*
