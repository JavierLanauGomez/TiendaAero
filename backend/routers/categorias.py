from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obtener_conexion

enrutador = APIRouter()


class CategoriaNueva(BaseModel):
    nombre:      str
    descripcion: str | None = None


class CategoriaActualizar(BaseModel):
    nombre:      str | None = None
    descripcion: str | None = None


@enrutador.get("/categorias")
def listar_categorias():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categorias")
    categorias = cursor.fetchall()
    cursor.close()
    conexion.close()
    return categorias


@enrutador.get("/categorias/{id}")
def obtener_categoria(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categorias WHERE id = %s", (id,))
    categoria = cursor.fetchone()
    cursor.close()
    conexion.close()
    if categoria is None:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return categoria


@enrutador.post("/categorias", status_code=201)
def crear_categoria(categoria: CategoriaNueva):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        "INSERT INTO categorias (nombre, descripcion) VALUES (%s, %s)",
        (categoria.nombre, categoria.descripcion)
    )
    conexion.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conexion.close()
    return {"id": nuevo_id, "mensaje": "Categoria creada"}


@enrutador.put("/categorias/{id}")
def actualizar_categoria(id: int, datos: CategoriaActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sentencia = "UPDATE categorias SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute(sentencia, valores)
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return {"mensaje": "Categoria actualizada"}


@enrutador.delete("/categorias/{id}")
def eliminar_categoria(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM categorias WHERE id = %s", (id,))
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Categoria no encontrada")
    return {"mensaje": "Categoria eliminada"}
