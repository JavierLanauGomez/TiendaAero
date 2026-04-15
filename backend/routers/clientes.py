from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obtener_cursor

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


@enrutador.get("/clientes")
def listar_clientes():
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM clientes")
        return cursor.fetchall()


@enrutador.get("/clientes/{id}")
def obtener_cliente(id: int):
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM clientes WHERE id = %s", (id,))
        cliente = cursor.fetchone()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@enrutador.post("/clientes", status_code=201)
def crear_cliente(cliente: ClienteNuevo):
    with obtener_cursor() as (_, cursor):
        cursor.execute(
            "INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (%s, %s, %s, %s)",
            (cliente.nombre, cliente.email, cliente.telefono, cliente.direccion)
        )
        nuevo_id = cursor.lastrowid
    return {"id": nuevo_id, "mensaje": "Cliente creado"}


@enrutador.put("/clientes/{id}")
def actualizar_cliente(id: int, datos: ClienteActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sentencia = "UPDATE clientes SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    with obtener_cursor() as (_, cursor):
        cursor.execute(sentencia, valores)
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente actualizado"}


@enrutador.get("/clientes/{id}/pedidos")
def pedidos_de_cliente(id: int):
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT id FROM clientes WHERE id = %s", (id,))
        if cursor.fetchone() is None:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        cursor.execute(
            "SELECT * FROM pedidos WHERE cliente_id = %s ORDER BY fecha DESC, id DESC",
            (id,)
        )
        return cursor.fetchall()


@enrutador.delete("/clientes/{id}")
def eliminar_cliente(id: int):
    with obtener_cursor() as (_, cursor):
        cursor.execute("DELETE FROM clientes WHERE id = %s", (id,))
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente eliminado"}
