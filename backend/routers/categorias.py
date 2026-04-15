from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obtener_cursor

enrutador = APIRouter()


class CategoriaNueva(BaseModel):
    nombre:      str
    descripcion: str | None = None


class CategoriaActualizar(BaseModel):
    nombre:      str | None = None
    descripcion: str | None = None


@enrutador.get("/categorias")
def listar_categorias():
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM categorias")
        return cursor.fetchall()


@enrutador.get("/categorias/{id}")
def obtener_categoria(id: int):
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM categorias WHERE id = %s", (id,))
        categoria = cursor.fetchone()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return categoria


@enrutador.post("/categorias", status_code=201)
def crear_categoria(categoria: CategoriaNueva):
    with obtener_cursor() as (_, cursor):
        cursor.execute(
            "INSERT INTO categorias (nombre, descripcion) VALUES (%s, %s)",
            (categoria.nombre, categoria.descripcion)
        )
        nuevo_id = cursor.lastrowid
    return {"id": nuevo_id, "mensaje": "Categoria creada"}


@enrutador.put("/categorias/{id}")
def actualizar_categoria(id: int, datos: CategoriaActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sentencia = "UPDATE categorias SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    with obtener_cursor() as (_, cursor):
        cursor.execute(sentencia, valores)
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return {"mensaje": "Categoria actualizada"}


@enrutador.delete("/categorias/{id}")
def eliminar_categoria(id: int):
    with obtener_cursor() as (_, cursor):
        cursor.execute("DELETE FROM categorias WHERE id = %s", (id,))
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return {"mensaje": "Categoria eliminada"}
