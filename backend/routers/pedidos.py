from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from database import obtener_conexion

enrutador = APIRouter()


class LineaPedido(BaseModel):
    producto_id: int
    cantidad:    int


class PedidoNuevo(BaseModel):
    cliente_id: int
    lineas:     list[LineaPedido]


class EstadoPedido(BaseModel):
    estado: Literal["pendiente", "enviado", "entregado"]


class LineasPedido(BaseModel):
    lineas: list[LineaPedido]


@enrutador.get("/pedidos")
def listar_pedidos():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pedidos")
    pedidos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return pedidos


@enrutador.get("/pedidos/{id}")
def obtener_pedido(id: int):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pedidos WHERE id = %s", (id,))
    pedido = cursor.fetchone()
    if pedido is None:
        cursor.close()
        conexion.close()
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    cursor.execute("SELECT * FROM detalle_pedidos WHERE pedido_id = %s", (id,))
    pedido["lineas"] = cursor.fetchall()
    cursor.close()
    conexion.close()
    return pedido


@enrutador.post("/pedidos", status_code=201)
def crear_pedido(pedido: PedidoNuevo):
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    total = 0
    lineas_con_precio = []

    for linea in pedido.lineas:
        cursor.execute("SELECT precio, stock FROM productos WHERE id = %s", (linea.producto_id,))
        producto = cursor.fetchone()
        if producto is None:
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail=f"Producto {linea.producto_id} no encontrado")
        if producto["stock"] < linea.cantidad:
            cursor.close()
            conexion.close()
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para el producto {linea.producto_id} (disponible: {producto['stock']})"
            )
        precio_unitario = producto["precio"]
        total += precio_unitario * linea.cantidad
        lineas_con_precio.append((linea.producto_id, linea.cantidad, precio_unitario))

    cursor.execute(
        "INSERT INTO pedidos (cliente_id, total) VALUES (%s, %s)",
        (pedido.cliente_id, round(total, 2))
    )
    nuevo_id = cursor.lastrowid

    for producto_id, cantidad, precio_unitario in lineas_con_precio:
        cursor.execute(
            "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (%s, %s, %s, %s)",
            (nuevo_id, producto_id, cantidad, precio_unitario)
        )
        cursor.execute(
            "UPDATE productos SET stock = stock - %s WHERE id = %s",
            (cantidad, producto_id)
        )

    conexion.commit()
    cursor.close()
    conexion.close()
    return {"id": nuevo_id, "total": round(total, 2), "mensaje": "Pedido creado"}


@enrutador.put("/pedidos/{id}/lineas")
def actualizar_lineas_pedido(id: int, datos: LineasPedido):
    if not datos.lineas:
        from fastapi import HTTPException as _HTTPException
        raise _HTTPException(status_code=400, detail="El pedido debe tener al menos una linea")

    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    # Verificar que el pedido existe
    cursor.execute("SELECT id FROM pedidos WHERE id = %s", (id,))
    if cursor.fetchone() is None:
        cursor.close()
        conexion.close()
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    # Devolver stock de las lineas actuales
    cursor.execute(
        "SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = %s", (id,)
    )
    for linea in cursor.fetchall():
        cursor.execute(
            "UPDATE productos SET stock = stock + %s WHERE id = %s",
            (linea["cantidad"], linea["producto_id"])
        )

    # Borrar lineas actuales
    cursor.execute("DELETE FROM detalle_pedidos WHERE pedido_id = %s", (id,))

    # Validar stock y calcular nuevo total
    total = 0
    lineas_con_precio = []
    for linea in datos.lineas:
        cursor.execute("SELECT precio, stock FROM productos WHERE id = %s", (linea.producto_id,))
        producto = cursor.fetchone()
        if producto is None:
            conexion.rollback()
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail=f"Producto {linea.producto_id} no encontrado")
        if producto["stock"] < linea.cantidad:
            conexion.rollback()
            cursor.close()
            conexion.close()
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para el producto {linea.producto_id} (disponible: {producto['stock']})"
            )
        precio_unitario = producto["precio"]
        total += precio_unitario * linea.cantidad
        lineas_con_precio.append((linea.producto_id, linea.cantidad, precio_unitario))

    # Insertar nuevas lineas y descontar stock
    for producto_id, cantidad, precio_unitario in lineas_con_precio:
        cursor.execute(
            "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (%s, %s, %s, %s)",
            (id, producto_id, cantidad, precio_unitario)
        )
        cursor.execute(
            "UPDATE productos SET stock = stock - %s WHERE id = %s",
            (cantidad, producto_id)
        )

    # Actualizar total del pedido
    cursor.execute("UPDATE pedidos SET total = %s WHERE id = %s", (round(total, 2), id))
    conexion.commit()
    cursor.close()
    conexion.close()
    return {"mensaje": "Lineas actualizadas", "total": round(total, 2)}


@enrutador.put("/pedidos/{id}/estado")
def actualizar_estado_pedido(id: int, datos: EstadoPedido):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    cursor.execute("UPDATE pedidos SET estado = %s WHERE id = %s", (datos.estado, id))
    conexion.commit()
    filas_afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if filas_afectadas == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return {"mensaje": "Estado actualizado"}
