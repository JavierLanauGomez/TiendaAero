from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_conexion

router = APIRouter()


class ProductoNuevo(BaseModel):
    nombre:       str
    descripcion:  str | None = None
    precio:       float
    stock:        int        = 0
    stock_minimo: int        = 1
    categoria_id: int
    marca:        str | None = None
    imagen_url:   str | None = None


class ProductoActualizar(BaseModel):
    nombre:       str | None = None
    descripcion:  str | None = None
    precio:       float | None = None
    stock:        int | None = None
    stock_minimo: int | None = None
    categoria_id: int | None = None
    marca:        str | None = None
    imagen_url:   str | None = None


@router.get("/productos")
def listar_productos(categoria: int = None):
    conexion = get_conexion()
    cursor = conexion.cursor(dictionary=True)
    if categoria is None:
        cursor.execute("SELECT * FROM productos")
    else:
        cursor.execute("SELECT * FROM productos WHERE categoria_id = %s", (categoria,))
    productos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return productos


@router.get("/productos/{id}")
def obtener_producto(id: int):
    conexion = get_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM productos WHERE id = %s", (id,))
    producto = cursor.fetchone()
    cursor.close()
    conexion.close()
    if producto is None:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.post("/productos", status_code=201)
def crear_producto(producto: ProductoNuevo):
    conexion = get_conexion()
    cursor = conexion.cursor()
    cursor.execute(
        """
        INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria_id, marca, imagen_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (producto.nombre, producto.descripcion, producto.precio,
         producto.stock, producto.stock_minimo, producto.categoria_id,
         producto.marca, producto.imagen_url)
    )
    conexion.commit()
    nuevo_id = cursor.lastrowid
    cursor.close()
    conexion.close()
    return {"id": nuevo_id, "mensaje": "Producto creado"}


@router.put("/productos/{id}")
def actualizar_producto(id: int, datos: ProductoActualizar):
    campos = {k: v for k, v in datos.model_dump().items() if v is not None}
    if not campos:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    sql = "UPDATE productos SET " + ", ".join(f"{k} = %s" for k in campos) + " WHERE id = %s"
    valores = list(campos.values()) + [id]
    conexion = get_conexion()
    cursor = conexion.cursor()
    cursor.execute(sql, valores)
    conexion.commit()
    afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if afectadas == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"mensaje": "Producto actualizado"}


@router.delete("/productos/{id}")
def eliminar_producto(id: int):
    conexion = get_conexion()
    cursor = conexion.cursor()
    cursor.execute("DELETE FROM productos WHERE id = %s", (id,))
    conexion.commit()
    afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if afectadas == 0:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return {"mensaje": "Producto eliminado"}
