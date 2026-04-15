from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, field_validator
from database import obtener_cursor

enrutador = APIRouter()


class ProductoNuevo(BaseModel):
    nombre:       str
    descripcion:  str | None = None
    precio:       float
    stock:        int        = 0
    stock_minimo: int        = 1
    categoria_id: int
    marca:        str | None = None
    imagen_url:   str | None = None

    @field_validator("precio")
    @classmethod
    def precio_positivo(cls, v):
        if v < 0:
            raise ValueError("El precio no puede ser negativo")
        return round(v, 2)

    @field_validator("stock", "stock_minimo")
    @classmethod
    def stock_no_negativo(cls, v):
        if v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


class ProductoActualizar(BaseModel):
    nombre:       str | None   = None
    descripcion:  str | None   = None
    precio:       float | None = None
    stock:        int | None   = None
    stock_minimo: int | None   = None
    categoria_id: int | None   = None
    marca:        str | None   = None
    imagen_url:   str | None   = None

    @field_validator("precio")
    @classmethod
    def precio_positivo(cls, v):
        if v is not None and v < 0:
            raise ValueError("El precio no puede ser negativo")
        return v

    @field_validator("stock", "stock_minimo")
    @classmethod
    def stock_no_negativo(cls, v):
        if v is not None and v < 0:
            raise ValueError("El stock no puede ser negativo")
        return v


@enrutador.get("/productos")
def listar_productos(
    categoria: int = None,
    pagina: int = Query(default=1, ge=1),
    tamano: int = Query(default=100, ge=1, le=500),
):
    offset = (pagina - 1) * tamano
    with obtener_cursor(dictionary=True) as (_, cursor):
        if categoria is None:
            cursor.execute(
                "SELECT * FROM productos ORDER BY id DESC LIMIT %s OFFSET %s",
                (tamano, offset)
            )
        else:
            cursor.execute(
                "SELECT * FROM productos WHERE categoria_id = %s ORDER BY id DESC LIMIT %s OFFSET %s",
                (categoria, tamano, offset)
            )
        productos = cursor.fetchall()

        # Total para cabecera de paginación
        if categoria is None:
            cursor.execute("SELECT COUNT(*) AS total FROM productos")
        else:
            cursor.execute("SELECT COUNT(*) AS total FROM productos WHERE categoria_id = %s", (categoria,))
        total = cursor.fetchone()["total"]

    return {"productos": productos, "total": total, "pagina": pagina, "tamano": tamano}


@enrutador.get("/productos/{id}")
def obtener_producto(id: int):
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM productos WHERE id = %s", (id,))
        producto = cursor.fetchone()
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@enrutador.post("/productos", status_code=201)
def crear_producto(producto: ProductoNuevo):
    with obtener_cursor() as (_, cursor):
        cursor.execute(
            """
            INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria_id, marca, imagen_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (producto.nombre, producto.descripcion, producto.precio,
             producto.stock, producto.stock_minimo, producto.categoria_id,
             producto.marca, producto.imagen_url)
        )
        nuevo_id = cursor.lastrowid
    return {"id": nuevo_id, "mensaje": "Producto creado"}


@enrutador.put("/productos/{id}")
def actualizar_producto(id: int, datos: ProductoActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sentencia = "UPDATE productos SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    with obtener_cursor() as (_, cursor):
        cursor.execute(sentencia, valores)
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"mensaje": "Producto actualizado"}


@enrutador.delete("/productos/{id}")
def eliminar_producto(id: int):
    with obtener_cursor() as (_, cursor):
        cursor.execute("DELETE FROM productos WHERE id = %s", (id,))
        filas_afectadas = cursor.rowcount
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"mensaje": "Producto eliminado"}
