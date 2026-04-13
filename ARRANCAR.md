# ARRANCAR — TiendaAero

## Requisitos previos

Antes de arrancar por primera vez, asegúrate de tener instalado:

- **Python 3.11 o superior** — [python.org](https://www.python.org/downloads/)  
  *(marca "Add Python to PATH" durante la instalación)*
- **MySQL 8.0 o superior** — [dev.mysql.com](https://dev.mysql.com/downloads/installer/)  
  *(o XAMPP con el módulo MySQL activado)*

---

## Primera vez

### 1. Crear la base de datos

Abre MySQL Workbench (o la línea de comandos) y ejecuta el script completo:

```
mysql -u root -p < database.sql
```

O ábrelo en MySQL Workbench y pulsa el rayo ⚡.

Esto crea la base de datos `tiendaaero` con todas las tablas y datos de ejemplo.

### 2. Configurar las credenciales

Edita el fichero `backend/.env` y pon tus valores:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña_aqui
DB_NAME=tiendaaero
JWT_SECRET=cambia_esto_por_una_clave_larga_y_aleatoria
```

### 3. Crear el usuario administrador

Ejecuta este comando una sola vez para crear el usuario de acceso:

```
venv\Scripts\python.exe backend\crear_admin.py
```

Si el entorno virtual aún no existe, primero haz el paso 4 y luego vuelve aquí.

### 4. Arrancar la aplicación

Doble clic en **`arrancar.bat`**.

El script detecta que es la primera vez, crea el entorno virtual e instala todas las dependencias automáticamente. No tienes que hacer nada más.

---

## Resto de veces

Doble clic en **`arrancar.bat`**.

Se abren dos ventanas y el navegador arranca solo en `http://localhost:3000`.

Inicia sesión con el usuario que creaste en el paso 3.

---

## URLs

| Servicio | URL |
|----------|-----|
| Aplicación (frontend) | http://localhost:3000 |
| API (backend) | http://127.0.0.1:8000 |
| Documentación interactiva de la API | http://127.0.0.1:8000/docs |

---

## Para parar

Cierra las dos ventanas negras que abrió el script.

---

## Estructura del proyecto

```
TiendaAero/
├── arrancar.bat              ← Script de arranque (doble clic)
├── database.sql              ← Script SQL para crear la base de datos
├── ARRANCAR.md               ← Este fichero
├── DOCUMENTO_TECNICO.md      ← Documentación técnica completa
├── CREAR_DESDE_CERO.md       ← Guía paso a paso de construcción
├── backend/
│   ├── .env                  ← Credenciales (no subir a git)
│   ├── .env.example          ← Plantilla de credenciales
│   ├── requirements.txt      ← Dependencias Python
│   ├── main.py               ← Punto de entrada del backend
│   ├── database.py           ← Conexión a MySQL
│   ├── auth.py               ← Lógica JWT (tokens y verificación)
│   ├── crear_admin.py        ← Script para crear el usuario admin
│   └── routers/
│       ├── autenticacion.py  ← Endpoint de login
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
        ├── auth.js           ← Login, logout y gestión del token
        ├── api.js
        ├── app.js
        ├── categorias.js
        ├── productos.js
        ├── clientes.js
        └── pedidos.js
```

---

## Solución de problemas

**La ventana del backend se cierra sola**
- Comprueba que MySQL está arrancado.
- Verifica que la contraseña en `backend/.env` es correcta.
- Verifica que la base de datos `tiendaaero` existe (ejecuta `database.sql` si no).

**El navegador muestra la página en blanco o no carga datos**
- Asegúrate de que las dos ventanas negras siguen abiertas.
- Comprueba que accedes a `http://localhost:3000` y no a `file://...`.

**Error "python no se reconoce como comando"**
- Reinstala Python marcando "Add Python to PATH".

**Puerto 8000 o 3000 ya en uso**
- Cierra la aplicación que esté usando ese puerto, o reinicia el ordenador.

**La sesión expira y no puedo entrar**
- El token dura 8 horas. Recarga la página y vuelve a iniciar sesión.
