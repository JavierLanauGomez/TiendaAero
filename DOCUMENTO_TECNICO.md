# DOCUMENTO TÉCNICO — TiendaAero
## Guía completa para la defensa del proyecto de FCT

---

## 1. BASE DE DATOS

### Tecnología utilizada: MySQL

Se ha elegido **MySQL** por varias razones sólidas:
- Es el sistema gestor de bases de datos relacional más utilizado en el mundo empresarial y educativo.
- Tiene soporte nativo excelente con Python a través del conector oficial `mysql-connector-python`.
- Es gratuito, maduro, bien documentado y fácil de instalar en local (XAMPP, MySQL Workbench, etc.).
- Soporta transacciones ACID, claves foráneas y el motor **InnoDB**, que es lo que este proyecto necesita para garantizar la integridad referencial.

Alternativa que podrías mencionar: PostgreSQL (más robusto, mejor para producción) o SQLite (más simple, sin servidor, bueno para desarrollo rápido).

---

### Estructura de tablas y relaciones

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

### Descripción de cada tabla

**`categorias`** — Agrupa los productos por tipo (Aviones, Drones, etc.)
- `id`: clave primaria con autoincremento.
- `nombre`: único (`UNIQUE KEY`) para evitar categorías duplicadas.
- `descripcion`: campo opcional (TEXT porque puede ser largo).

**`productos`** — Catálogo de artículos de la tienda.
- `categoria_id`: clave foránea hacia `categorias`. Con `ON UPDATE CASCADE` (si cambia el id de una categoría, se actualiza aquí) y `ON DELETE RESTRICT` (no se puede borrar una categoría que tenga productos asociados).
- `stock` y `stock_minimo`: permiten saber cuándo hay que reponer.
- `precio`: tipo `DECIMAL(10,2)` en lugar de `FLOAT` para evitar errores de redondeo en dinero.
- `imagen_url`: URL de la imagen del producto (hasta 500 caracteres).

**`clientes`** — Compradores registrados.
- `email`: campo único para evitar clientes duplicados.
- `fecha_registro` tiene valor por defecto `CURRENT_DATE`.

**`pedidos`** — Cabecera de cada compra.
- `estado`: tipo `ENUM` limitando los valores posibles a `pendiente`, `enviado`, `entregado`. Esto es una restricción a nivel de base de datos, no solo de aplicación.
- `total`: se guarda calculado para rendimiento (no hay que recalcularlo cada vez que se lee el pedido).
- `ON DELETE RESTRICT` en `cliente_id`: no se puede borrar un cliente que tenga pedidos.

**`detalle_pedidos`** — Las líneas de cada pedido (tabla de intersección).
- Resuelve la relación **muchos a muchos** entre `pedidos` y `productos`.
- `precio_unitario` se guarda en el momento de la compra (snapshot del precio). Esto es crucial: si el precio del producto cambia mañana, el histórico del pedido sigue siendo correcto.
- `ON DELETE CASCADE` en `pedido_id`: si se elimina un pedido, sus líneas se borran automáticamente.
- `ON DELETE RESTRICT` en `producto_id`: no se puede borrar un producto que aparezca en pedidos.

### ¿Por qué este diseño y no otro?

- **Normalización 3FN**: No hay datos repetidos. El nombre del cliente no se repite en cada pedido; se guarda el `cliente_id` y se hace JOIN cuando se necesita.
- **Integridad referencial con InnoDB**: Las claves foráneas garantizan que no puede existir un pedido sin cliente, ni un detalle sin pedido y sin producto.
- **ENUM para estado**: Evita que alguien inserte un estado inválido como "cancelado" sin modificar el schema.
- **`utf8mb4`**: El charset más completo de MySQL; soporta emojis y todos los caracteres Unicode, importante para nombres y descripciones en español.

---

## 2. CONEXIÓN BASE DE DATOS ↔ BACKEND

### Archivo: `backend/database.py`

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

**¿Cómo funciona?**

1. `load_dotenv(override=True)` carga el fichero `backend/.env` y mete sus variables en el entorno del proceso. El parámetro `override=True` garantiza que los valores del `.env` sobreescriben cualquier variable de entorno del sistema con el mismo nombre.
2. `obtener_conexion()` crea y devuelve una conexión nueva usando `mysql-connector-python`, el driver oficial de MySQL para Python.
3. Los parámetros de conexión (`host`, `puerto`, `usuario`, `contraseña`, `base de datos`) se leen de las variables de entorno, nunca están escritos en el código.

**¿Por qué está en un fichero separado (`database.py`)?**

Por el principio de **responsabilidad única**: este módulo solo sabe cómo conectarse a la base de datos. Si mañana cambias a PostgreSQL o a una base de datos en la nube, solo tocas este fichero.

**¿Por qué las credenciales están en `.env` y no en el código?**

Por seguridad. Si subes el código a GitHub, la contraseña no viaja con él. El fichero `.env` está listado en `.gitignore`. El fichero `.env.example` sirve de plantilla para que otro desarrollador sepa qué variables necesita configurar.

**Gestión de errores de conexión**

Actualmente, si la base de datos no está disponible, `mysql.connector.connect()` lanza una excepción `mysql.connector.Error` que FastAPI captura y devuelve como HTTP 500. Esto es un punto de mejora: no hay un mensaje personalizado ni reintentos automáticos. En producción se usaría un pool de conexiones.

**Limitación importante — conexión por petición:**
Cada vez que llega una petición HTTP, se llama a `obtener_conexion()`, se crea una conexión nueva a MySQL, se usa y se cierra. Esto funciona bien en desarrollo, pero en producción con muchos usuarios simultáneos sería muy lento. La mejora sería usar un **connection pool** (por ejemplo, con `SQLAlchemy` o con `mysql-connector-python` pooling).

---

## 3. BACKEND — Arquitectura y Módulos

### Tecnología: Python + FastAPI

**¿Por qué Python?** Lenguaje muy legible, amplio ecosistema, muy usado en el sector.

**¿Por qué FastAPI y no Flask o Django?**
- **FastAPI** genera automáticamente documentación interactiva (`/docs` con Swagger UI).
- Tiene validación automática de datos de entrada con **Pydantic** (si mandas un campo con tipo incorrecto, FastAPI devuelve un 422 explicativo sin que escribas código de validación).
- Es moderno (async nativo, tipado), más rápido que Flask para APIs.
- Django sería excesivo para un proyecto sin plantillas HTML ni ORM complejo.

### Estructura de carpetas del backend

```
backend/
├── .env              ← Variables de entorno (no sube a git)
├── .env.example      ← Plantilla de variables de entorno
├── main.py           ← Punto de entrada: crea la app, registra routers
├── database.py       ← Gestión de la conexión a MySQL
└── routers/
    ├── __init__.py   ← Hace que "routers" sea un paquete Python
    ├── categorias.py ← Endpoints CRUD de categorías
    ├── productos.py  ← Endpoints CRUD de productos
    ├── clientes.py   ← Endpoints CRUD de clientes
    └── pedidos.py    ← Endpoints de pedidos (lógica más compleja)
```

### ¿Qué hace cada archivo?

**`main.py`** — Es el punto de entrada de la aplicación. Sus responsabilidades son:
1. Crear la instancia de FastAPI.
2. Configurar el middleware CORS (para que el frontend pueda llamar al backend).
3. Registrar todos los routers (que son los módulos que definen los endpoints).

**`database.py`** — Único sitio donde sabe cómo conectarse a MySQL. (Ver sección 2.)

**`routers/__init__.py`** — Fichero vacío que convierte la carpeta `routers/` en un paquete Python, permitiendo hacer `from routers import productos`.

**`routers/categorias.py`, `clientes.py`, `productos.py`** — Cada uno sigue el mismo patrón:
- Define los **modelos Pydantic** (clases que describen la estructura del JSON de entrada).
- Define los **endpoints** (funciones decoradas con `@enrutador.get`, `@enrutador.post`, etc.).
- Cada endpoint abre conexión, ejecuta SQL, cierra conexión y devuelve resultado.

**`routers/pedidos.py`** — Es el más complejo porque:
- Al crear un pedido, consulta el precio actual de cada producto.
- Verifica que haya stock suficiente antes de confirmar.
- Descuenta el stock de cada producto.
- Todo esto ocurre en una sola transacción (un solo `commit()`).

### Modelos Pydantic: ¿qué son y para qué sirven?

```python
class ProductoNuevo(BaseModel):
    nombre:       str
    precio:       float
    stock:        int = 0
    categoria_id: int
    ...
```

Pydantic valida automáticamente el JSON que llega en el cuerpo de la petición. Si `precio` llega como texto `"hola"` en vez de un número, FastAPI responde con HTTP 422 y un mensaje claro del error, sin que hayas escrito ni una línea de validación manual.

El patrón de tener dos clases por entidad (`ProductoNuevo` y `ProductoActualizar`) es intencionado:
- **`Nuevo`**: todos los campos obligatorios tienen que venir (o tienen default).
- **`Actualizar`**: todos los campos son opcionales (`| None = None`) para soportar PATCH semántico vía PUT — solo actualizas los campos que envías.

---

## 4. API REST

### Listado completo de endpoints

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

#### Raíz

| Método | Ruta | Qué hace |
|--------|------|----------|
| GET | `/` | Mensaje de bienvenida (health check) |

### Buenas prácticas REST aplicadas

- **Verbos HTTP correctos**: GET para leer, POST para crear, PUT para actualizar, DELETE para borrar.
- **Recursos en plural y en minúsculas**: `/categorias`, `/productos`.
- **HTTP 201** al crear recursos en vez del genérico 200.
- **HTTP 404** cuando el recurso no existe.
- **HTTP 400** cuando los datos son inválidos (ej: sin campos para actualizar, stock insuficiente).
- **Respuestas JSON** siempre consistentes.
- **Parámetro de query** para filtrar: `GET /productos?categoria=3` en vez de `GET /productos/categoria/3`.

### Autenticación y autorización

**No existe.** Cualquiera que conozca la URL puede leer, crear, modificar o borrar datos. Este es el **punto más crítico para mejorar** en una aplicación real. En producción se implementaría:
- **JWT (JSON Web Tokens)**: el usuario hace login, recibe un token firmado, y lo manda en la cabecera `Authorization: Bearer <token>` en cada petición.
- **OAuth2** con scopes para control de acceso más fino.

FastAPI tiene soporte nativo para OAuth2 + JWT con muy poco código adicional.

---

## 5. FRONTEND — Arquitectura y Módulos

### Tecnología: HTML + CSS + JavaScript Vanilla (SPA)

**¿Por qué Vanilla JS y no React/Vue/Angular?**

- No requiere Node.js ni proceso de compilación para el frontend — abriendo el `index.html` funciona directamente.
- Más sencillo de entender y defender en una entrevista: no hay magia de framework.
- Para un proyecto de este tamaño (4 secciones CRUD), un framework sería sobreingeniería.
- Demuestra que se entienden los fundamentos: DOM, eventos, fetch, async/await.

**Patrón SPA (Single Page Application):**
Hay un solo fichero HTML. La navegación no recarga la página; en su lugar, se muestran/ocultan secciones usando clases CSS (`oculta`/visible) y se gestiona mediante el **hash de la URL** (`#categorias`, `#productos`, etc.).

### Estructura de ficheros del frontend

```
frontend/
├── index.html         ← La única página HTML del proyecto
├── css/
│   └── estilos.css    ← Todos los estilos visuales
└── js/
    ├── config.js      ← URL base de la API
    ├── api.js         ← Funciones de comunicación con el backend
    ├── app.js         ← Navegación, modal, toast, utilidades
    ├── categorias.js  ← Lógica de la sección Categorías
    ├── productos.js   ← Lógica de la sección Productos
    ├── clientes.js    ← Lógica de la sección Clientes
    └── pedidos.js     ← Lógica de la sección Pedidos
```

**Orden de carga en el HTML (importante):**
Los scripts se cargan en el orden en que aparecen en el `<body>`. `config.js` primero porque define `API_URL` que necesita `api.js`. `api.js` antes que los demás porque todos usan sus funciones. `app.js` antes que los módulos de sección porque define `abrirModal`, `mostrarToast`, etc.

### ¿Qué hace cada fichero JS?

**`config.js`** — Una sola constante: `const API_URL = 'http://127.0.0.1:8000'`. Si el backend cambia de puerto o va a producción, solo se toca aquí.

**`api.js`** — Cuatro funciones que envuelven `fetch()`:
- `obtenerDatos(ruta)` → GET
- `enviarDatos(ruta, datos)` → POST con JSON
- `modificarDatos(ruta, datos)` → PUT con JSON
- `borrarDatos(ruta)` → DELETE

El valor de tener estas funciones es que el manejo de errores (`if (!respuesta.ok) throw new Error(...)`) y las cabeceras (`Content-Type: application/json`) se escriben una sola vez, y el resto del código las usa sin repetir ese boilerplate.

**`app.js`** — Tres responsabilidades:
1. **Navegación SPA**: escucha el evento `hashchange` y el evento `load` para mostrar la sección correcta.
2. **Modal compartido**: `abrirModal(titulo, html)` y `cerrarModal()` manejan la única ventana emergente del proyecto.
3. **Toast de notificaciones**: `mostrarToast(mensaje, tipo)` muestra mensajes de éxito/error que desaparecen solos tras 3 segundos.

**`categorias.js`, `clientes.js`, `productos.js`** — Siguen el mismo patrón:
- Variable `_lista` (caché en memoria de los datos cargados).
- `cargarX()`: pide datos al backend y genera el HTML de la tabla.
- `abrirFormX(id?)`: abre el modal con el formulario de creación/edición.
- `guardarX(evento)`: recoge el formulario y llama a `enviarDatos` o `modificarDatos`.
- `eliminarX(id)`: pide confirmación y llama a `borrarDatos`.

**`pedidos.js`** — El más complejo. Además del patrón anterior:
- `agregarLineaPedido()`: añade dinámicamente una nueva fila (select de producto + input de cantidad) al formulario.
- `recalcularTotal()`: cada vez que cambia un producto o cantidad, recorre todas las líneas y actualiza el total estimado en tiempo real.
- `buscarNombreCliente/Producto()`: busca en la caché local en lugar de hacer otra llamada al backend.

### Gestión del estado

No hay librería de gestión de estado (Redux, Pinia, etc.). El estado se gestiona con variables globales en cada módulo:

```javascript
var _categorias = [];  // en categorias.js
var _productos = [];   // en productos.js
var _clientes = [];    // en clientes.js
var _pedidos = [];     // en pedidos.js
```

Cuando se carga una sección, se hace la petición y se guardan los datos en estas variables. `pedidos.js` accede a `_clientes` y `_productos` (definidas en otros ficheros) para mostrar nombres en vez de IDs.

---

## 6. CONEXIÓN FRONTEND ↔ BACKEND

### Mecanismo: `fetch()` nativo del navegador

Se usa la API `fetch()` del navegador, que es moderna, nativa (no requiere librerías externas) y soporta `async/await`.

### ¿Cómo fluye una petición?

```
Usuario hace clic en "Guardar"
        ↓
guardarProducto(evento) en productos.js
        ↓
enviarDatos('/productos', datos) en api.js
        ↓
fetch('http://127.0.0.1:8000/productos', {method:'POST', body: JSON.stringify(datos)})
        ↓
  Navegador → Red → FastAPI (puerto 8000)
        ↓
  FastAPI valida con Pydantic, ejecuta SQL, devuelve JSON
        ↓
  api.js: si !respuesta.ok → throw Error
          si ok → return respuesta.json()
        ↓
  productos.js: mostrarToast("Producto creado"), cerrarModal(), cargarProductos()
```

### CORS: qué es y por qué aparece aquí

**CORS** (Cross-Origin Resource Sharing) es un mecanismo de seguridad de los navegadores que bloquea peticiones JavaScript a un dominio diferente del que sirvió la página.

En este proyecto:
- El **frontend** se sirve desde `http://127.0.0.1:5500` (Live Server de VS Code) o `http://localhost:3000`.
- El **backend** escucha en `http://127.0.0.1:8000`.

Son orígenes distintos (distinto puerto = distinto origen), por eso el navegador bloqueará las peticiones salvo que el backend diga explícitamente "acepto peticiones de esos orígenes".

**Configuración en `main.py`:**
```python
aplicacion.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Esto añade la cabecera `Access-Control-Allow-Origin` a todas las respuestas HTTP. El navegador la lee y permite la petición.

**Punto de mejora**: `allow_methods=["*"]` y `allow_headers=["*"]` son muy permisivos. En producción se limitarían a lo estrictamente necesario. Además, si se añade autenticación, habría que añadir `allow_credentials=True`.

### Variables de entorno y configuración de URLs

- **Backend**: las credenciales de BD están en `backend/.env` (nunca en el código).
- **Frontend**: la URL del backend está en `frontend/js/config.js` como constante `API_URL`. Esto facilita cambiarla cuando se despliega en producción (cambiarías `http://127.0.0.1:8000` por la URL real del servidor).

---

## 7. TESTING

**El proyecto no tiene tests automatizados.** Esta es una carencia significativa que debes reconocer y saber cómo subsanar.

### ¿Qué tests se deberían añadir?

**Tests unitarios del backend** con `pytest` + `httpx`:

```python
# Ejemplo de cómo sería un test
from fastapi.testclient import TestClient
from main import aplicacion

cliente = TestClient(aplicacion)

def test_listar_categorias():
    respuesta = cliente.get("/categorias")
    assert respuesta.status_code == 200
    assert isinstance(respuesta.json(), list)

def test_crear_categoria():
    respuesta = cliente.post("/categorias", json={"nombre": "Test"})
    assert respuesta.status_code == 201
    assert "id" in respuesta.json()
```

**Tests de integración**: probar el flujo completo de crear un pedido verificando que el stock se descuenta correctamente.

**Tests del frontend**: con herramientas como **Playwright** o **Cypress** para simular clics de usuario y verificar que la UI responde correctamente.

### ¿Por qué no hay tests?

En el contexto de un proyecto de FCT con tiempo limitado, es habitual priorizar la funcionalidad. Sin embargo, es importante reconocer que los tests son fundamentales en proyectos reales y que añadirlos sería el siguiente paso natural.

### Cómo ejecutar los tests (si existieran)

```bash
cd backend
pip install pytest httpx
pytest tests/ -v
```

---

## 8. FLUJO COMPLETO DE UNA OPERACIÓN (End-to-End)

### Ejemplo: El usuario crea un nuevo pedido

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
- `app.js::abrirModal()` inserta el HTML del formulario en el `#modal-cuerpo` y lo hace visible.
- `agregarLineaPedido()` añade automáticamente la primera línea.

**Paso 4 — El usuario selecciona productos**
- Selecciona un cliente del desplegable.
- En la línea 1, selecciona "DJI Mini 4 Pro" y cantidad 1.
- Cada cambio dispara `recalcularTotal()`:
  - Busca el producto en `_productos` (caché local).
  - Suma `precio * cantidad` para cada línea.
  - Actualiza el texto `<span id="total-estimado">759.00</span>`.

**Paso 5 — El usuario hace clic en "Crear pedido"**
- El evento `submit` del formulario llama a `guardarPedido(evento)`.
- `evento.preventDefault()` evita que la página se recargue.
- Se recogen las líneas del DOM: `[{producto_id: 6, cantidad: 1}]`.
- Se llama a `enviarDatos('/pedidos', {cliente_id: 2, lineas: [...]})`.

**Paso 6 — El backend procesa el pedido**
- FastAPI recibe `POST /pedidos` con el JSON.
- Pydantic valida la estructura.
- `pedidos.py::crear_pedido()` se ejecuta:
  1. Para el producto 6 (DJI Mini 4 Pro): `SELECT precio, stock FROM productos WHERE id = 6` → precio=759.00, stock=6.
  2. Comprueba: `6 >= 1` → OK.
  3. Calcula total: `759.00 * 1 = 759.00`.
  4. `INSERT INTO pedidos (cliente_id, total) VALUES (2, 759.00)` → nuevo_id=4.
  5. `INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (4, 6, 1, 759.00)`.
  6. `UPDATE productos SET stock = stock - 1 WHERE id = 6` → stock queda en 5.
  7. `conexion.commit()` — todo esto es atómico (si algo falla antes del commit, nada se guarda).
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

## 9. PUNTOS FUERTES DEL PROYECTO

**Separación clara de responsabilidades (frontend)**
Cada entidad tiene su propio fichero JS. El código de productos no mezcla lógica de clientes. Si hay un bug en la gestión de pedidos, sabes exactamente dónde buscar.

**Capa de abstracción sobre fetch (api.js)**
Las cuatro funciones (`obtenerDatos`, `enviarDatos`, `modificarDatos`, `borrarDatos`) centralizan el manejo de errores y las cabeceras HTTP. Si mañana necesitas añadir un token de autorización a todas las peticiones, lo añades en un solo sitio.

**Modelos Pydantic para validación automática**
FastAPI + Pydantic valida los datos de entrada sin código manual. Si llega un JSON malformado, el backend responde con HTTP 422 y un mensaje claro.

**Snapshot del precio en pedidos**
El campo `precio_unitario` en `detalle_pedidos` guarda el precio en el momento de la compra. Si el precio del producto cambia, el histórico de pedidos sigue siendo correcto. Esta es una decisión de diseño madura.

**Transacción atómica al crear pedidos**
La verificación de stock, la inserción del pedido, las líneas y el descuento de stock ocurren en una sola transacción. O todo se guarda o nada. Esto evita inconsistencias en la base de datos.

**Navegación SPA con hash**
La aplicación no recarga la página al navegar, lo que da una experiencia más fluida. El hash en la URL permite que el botón "atrás" del navegador funcione y que puedas compartir la URL de una sección concreta.

**Total calculado en tiempo real**
El formulario de pedidos actualiza el total estimado en tiempo real conforme el usuario selecciona productos y cantidades, mejorando notablemente la experiencia de usuario.

**Variables de entorno para configuración sensible**
Las credenciales de base de datos nunca están en el código. El `.env.example` sirve como guía para otros desarrolladores.

**`utf8mb4` y `DECIMAL(10,2)`**
Decisiones correctas: `utf8mb4` para soporte completo de Unicode y `DECIMAL` en lugar de `FLOAT` para evitar errores de redondeo con precios.

---

## 10. COSAS A MEJORAR

### Sin autenticación ni autorización (crítico)
Actualmente cualquier persona con acceso a la red puede hacer `DELETE /clientes/1` y borrar un cliente. En una aplicación real se necesitaría al menos un login con JWT. En FastAPI es relativamente sencillo añadirlo con `python-jose` y `passlib`.

### Sin pool de conexiones (rendimiento)
Cada petición HTTP abre y cierra una conexión a MySQL. Con concurrencia alta, esto es un cuello de botella. La solución es usar **SQLAlchemy** como ORM con su pool de conexiones integrado, o configurar `mysql-connector-python` en modo pool.

### Sin tests automatizados
Añadir tests con `pytest` + `TestClient` de FastAPI aseguraría que los cambios futuros no rompen la funcionalidad existente.

### CORS demasiado permisivo
`allow_methods=["*"]` y `allow_headers=["*"]` deberían restringirse en producción a solo los métodos y cabeceras necesarios.

### Sin paginación en los listados
`GET /productos` devuelve todos los productos de la base de datos. Con un catálogo grande (miles de productos), esto sería muy lento. Se debería añadir paginación: `GET /productos?pagina=1&tamanio=20`.

### Sin validación de email en el cliente
El backend acepta cualquier string como email (`email: str`). Pydantic tiene un tipo `EmailStr` (del paquete `pydantic[email]`) que valida el formato automáticamente.

### El frontend usa `innerHTML` con datos del servidor (riesgo XSS)
En `pedidos.js` se inserta directamente el nombre del cliente/producto en el HTML sin sanitizar. Si un nombre contuviera `<script>alert('xss')</script>`, podría ejecutarse código malicioso. La solución es usar `textContent` en vez de `innerHTML` para los datos externos, o sanitizar con `DOMPurify`.

### Sin manejo de errores de conexión personalizados
Si la base de datos no está disponible, el usuario ve un error genérico HTTP 500. Sería mejor capturar `mysql.connector.Error` en `obtener_conexion()` y devolver un HTTP 503 (Service Unavailable) con un mensaje claro.

### Formulario de actualización abre siempre vacío
Al editar un registro, el formulario debería prerrellenar los valores actuales. Actualmente hay que volver a escribir todos los campos.

---

## 11. PREGUNTAS FRECUENTES EN UNA ENTREVISTA

---

**P: ¿Qué es una API REST y por qué la has implementado así?**

R: Una API REST es una interfaz de comunicación entre sistemas que sigue unas convenciones: usa los verbos HTTP para indicar la acción (GET=leer, POST=crear, PUT=actualizar, DELETE=borrar), organiza los recursos en URLs jerárquicas (como `/categorias`, `/categorias/5`) y devuelve JSON como formato de intercambio. La he implementado así porque es el estándar de la industria para comunicar frontends con backends, es stateless (el servidor no guarda el estado de la sesión), y cualquier cliente (navegador, app móvil, Postman) puede consumirla.

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

R: Para el backend, empaquetaría la aplicación en un contenedor **Docker** y la desplegaría en un servicio cloud (AWS, Azure, Render...) con `uvicorn` como servidor ASGI. La base de datos iría en un servicio gestionado (Amazon RDS, PlanetScale) en lugar de un MySQL local. Para el frontend, como son ficheros estáticos (HTML/CSS/JS), los subiría a un CDN o a un servicio como Netlify/Vercel. Actualizaría `API_URL` en `config.js` con la URL real del backend. Añadiría variables de entorno en el panel de configuración del proveedor cloud (no con `.env` en producción).

---

**P: ¿Qué añadirías si tuvieras más tiempo?**

R: Por orden de prioridad:
1. **Autenticación con JWT**: login de usuarios, protección de endpoints.
2. **Tests automatizados** con pytest.
3. **Paginación** en los listados de productos.
4. **Pool de conexiones** con SQLAlchemy.
5. **Validación de email** con `pydantic[email]`.
6. **Gestión de imágenes** (subida a servidor en vez de URLs externas).
7. **Sistema de búsqueda** de productos por nombre o marca.

---

*Documento generado a partir del análisis del código fuente del proyecto TiendaAero — Javier Lanau Gómez, FCT 2024/2025.*
