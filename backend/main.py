from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from routers import productos, clientes, pedidos, categorias, autenticacion, dashboard
from auth import obtener_usuario_actual

aplicacion = FastAPI()

aplicacion.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# El router de autenticacion NO necesita token (es el que lo genera)
aplicacion.include_router(autenticacion.enrutador)

# El resto de routers SI requieren token valido en cada peticion.
# dependencies=[Depends(obtener_usuario_actual)] protege TODOS los
# endpoints del router de una vez sin tocar cada funcion individualmente.
aplicacion.include_router(categorias.enrutador, dependencies=[Depends(obtener_usuario_actual)])
aplicacion.include_router(productos.enrutador,  dependencies=[Depends(obtener_usuario_actual)])
aplicacion.include_router(clientes.enrutador,   dependencies=[Depends(obtener_usuario_actual)])
aplicacion.include_router(pedidos.enrutador,    dependencies=[Depends(obtener_usuario_actual)])
aplicacion.include_router(dashboard.enrutador,  dependencies=[Depends(obtener_usuario_actual)])


@aplicacion.get("/")
def inicio():
    return {"mensaje": "Bienvenido a TiendaAero"}
