from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import obtener_cursor

enrutador = APIRouter()


class SocioNuevo(BaseModel):
    nombre:   str
    email:    str
    telefono: str | None = None


class SocioActualizar(BaseModel):
    nombre:    str | None = None
    email:     str | None = None
    telefono:  str | None = None
    estado:    str | None = None
    fecha_baja: str | None = None


@enrutador.get("/socios/estadisticas")
def estadisticas_socios():
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT COUNT(*) AS total FROM socios WHERE estado = 'activo'")
        activos = cursor.fetchone()['total']

        cursor.execute(
            "SELECT COUNT(*) AS total FROM socios "
            "WHERE estado = 'baja' AND YEAR(fecha_baja) = YEAR(CURDATE())"
        )
        bajas_anio = cursor.fetchone()['total']

        cursor.execute(
            "SELECT COUNT(*) AS total FROM socios "
            "WHERE MONTH(fecha_alta) = MONTH(CURDATE()) AND YEAR(fecha_alta) = YEAR(CURDATE())"
        )
        altas_mes = cursor.fetchone()['total']

    return {"activos": activos, "bajas_anio": bajas_anio, "altas_mes": altas_mes}


@enrutador.get("/socios")
def listar_socios():
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM socios ORDER BY fecha_alta DESC, id DESC")
        return cursor.fetchall()


@enrutador.get("/socios/{id}")
def obtener_socio(id: int):
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM socios WHERE id = %s", (id,))
        socio = cursor.fetchone()
    if socio is None:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    return socio


@enrutador.post("/socios", status_code=201)
def crear_socio(socio: SocioNuevo):
    with obtener_cursor() as (_, cursor):
        cursor.execute(
            "INSERT INTO socios (nombre, email, telefono) VALUES (%s, %s, %s)",
            (socio.nombre, socio.email, socio.telefono)
        )
        nuevo_id = cursor.lastrowid
    return {"id": nuevo_id, "mensaje": "Socio creado"}


@enrutador.put("/socios/{id}")
def actualizar_socio(id: int, datos: SocioActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sentencia = "UPDATE socios SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    with obtener_cursor() as (_, cursor):
        cursor.execute(sentencia, valores)
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    return {"mensaje": "Socio actualizado"}


@enrutador.delete("/socios/{id}")
def eliminar_socio(id: int):
    with obtener_cursor() as (_, cursor):
        cursor.execute("DELETE FROM socios WHERE id = %s", (id,))
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Socio no encontrado")
    return {"mensaje": "Socio eliminado"}
