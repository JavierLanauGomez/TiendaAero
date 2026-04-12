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
