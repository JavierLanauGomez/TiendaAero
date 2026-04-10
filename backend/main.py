from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import productos, clientes, pedidos

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:5500"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(productos.router)
app.include_router(clientes.router)
app.include_router(pedidos.router)


@app.get("/")
def inicio():
    return {"mensaje": "Bienvenido a TiendaAero"}
