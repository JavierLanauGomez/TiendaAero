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


@enrutador.get("/clientes")
def listar_clientes():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM clientes")
    clientes = cursor.fetchall()
    cursor.close()
    conexion.close()
    return clientes


@enrutador.get("/clientes/{id}")
def obtener_cliente(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM clientes WHERE id = %s", (id,))
    cliente = cursor.fetchone()
    cursor.close()
    conexion.close()
    if cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@enrutador.post("/clientes", status_code=201)
def crear_cliente(cliente: ClienteNuevo):
    conexion = obtener_conexion()
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


@enrutador.put("/clientes/{id}")
def actualizar_cliente(id: int, datos: ClienteActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sentencia = "UPDATE clientes SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(sentencia, valores)
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente actualizado"}


@enrutador.delete("/clientes/{id}")
def eliminar_cliente(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM clientes WHERE id = %s", (id,))
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente eliminado"}
