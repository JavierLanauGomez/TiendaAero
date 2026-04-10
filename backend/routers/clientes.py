from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_conexion

router = APIRouter()


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


@router.get("/clientes")
def listar_clientes():
    conexion = get_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM clientes")
    clientes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return clientes


@router.get("/clientes/{id}")
def obtener_cliente(id: int):
    conexion = get_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM clientes WHERE id = %s", (id,))
    cliente = cursor.fetchone()
    cursor.close()
    conexion.close()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.post("/clientes", status_code=201)
def crear_cliente(cliente: ClienteNuevo):
    conexion = get_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        "INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (%s, %s, %s, %s)",
        (cliente.nombre, cliente.email, cliente.telefono, cliente.direccion)
    )
    conexion.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conexion.close()
    return {"id": nuevo_id, "mensaje": "Cliente creado"}


@router.put("/clientes/{id}")
def actualizar_cliente(id: int, datos: ClienteActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sql = "UPDATE clientes SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    conexion = get_conexion()
    cursor = conexion.cursor()
    cursor.execute(sql, valores)
    conexion.commit()
    afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if afectadas == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente actualizado"}


@router.delete("/clientes/{id}")
def eliminar_cliente(id: int):
    conexion = get_conexion()
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM clientes WHERE id = %s", (id,))
    conexion.commit()
    afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if afectadas == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente eliminado"}
