# Como arrancar TiendaAero

## Paso 1 - Arrancar el backend

Abre una terminal en VS Code (Ctrl + n) y ejecuta:

    cd C:\Proyectos\TiendaAero\backend
    ..\venv\Scripts\uvicorn main:aplicacion --reload

Sabes que ha arrancado bien cuando ves:
    INFO: Uvicorn running on http://127.0.0.1:8000
    INFO: Application startup complete.

> Deja esta terminal abierta. Si la cierras, el backend se para.

## Paso 2 - Arrancar el frontend

En VS Code, haz clic derecho sobre frontend/index.html y selecciona Open with Live Server.
Se abrira el navegador en http://127.0.0.1:5500

## Paso 3 - Ver la documentacion de la API

Abre en el navegador: http://127.0.0.1:8000/docs
FastAPI genera ahi una pagina para probar todos los endpoints.

## Para parar el backend

En la terminal donde corre uvicorn, pulsa: Ctrl + C

## Si algo falla

- Access denied al conectar MySQL: revisa la contrasena en backend/.env
- Address already in use: ejecuta en PowerShell: Stop-Process -Name python -Force
- El frontend no carga datos: comprueba que http://127.0.0.1:8000/ responde
