@echo off
title TiendaAero
echo.
echo  ==============================
echo   Arrancando TiendaAero...
echo  ==============================
echo.

REM --- Comprobar que existe el entorno virtual ---
if not exist "%~dp0venv\Scripts\python.exe" (
    echo  [!] No se encuentra el entorno virtual.
    echo  [!] Creandolo e instalando dependencias...
    echo.
    python -m venv "%~dp0venv"
    "%~dp0venv\Scripts\pip.exe" install -r "%~dp0backend\requirements.txt"
    echo.
    echo  [OK] Entorno listo.
    echo.
)

REM --- Arrancar el backend (FastAPI) en una nueva ventana ---
start "TiendaAero - Backend (puerto 8000)" cmd /k "cd /d "%~dp0backend" && "%~dp0venv\Scripts\uvicorn.exe" main:aplicacion --reload"

REM --- Arrancar el servidor del frontend en una nueva ventana ---
start "TiendaAero - Frontend (puerto 3000)" cmd /k "cd /d "%~dp0frontend" && "%~dp0venv\Scripts\python.exe" -m http.server 3000"

REM --- Esperar 2 segundos a que los servidores arranquen ---
timeout /t 2 /nobreak >nul

REM --- Abrir el navegador ---
start http://localhost:3000

echo  Backend:   http://127.0.0.1:8000
echo  Frontend:  http://localhost:3000
echo  Docs API:  http://127.0.0.1:8000/docs
echo.
echo  Cierra las dos ventanas negras para parar los servidores.
echo.
