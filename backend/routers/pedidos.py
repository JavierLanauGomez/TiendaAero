from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Literal
from database import obtener_cursor

enrutador = APIRouter()


class LineaPedido(BaseModel):
    producto_id: int
    cantidad:    int


class PedidoNuevo(BaseModel):
    cliente_id: int
    lineas:     list[LineaPedido]


class EstadoPedido(BaseModel):
    estado: Literal["pendiente", "enviado", "entregado", "cancelado"]


class LineasPedido(BaseModel):
    lineas: list[LineaPedido]


@enrutador.get("/pedidos")
def listar_pedidos(
    pagina: int = Query(default=1, ge=1),
    tamano: int = Query(default=100, ge=1, le=500),
    estado: str = None,
):
    offset = (pagina - 1) * tamano
    with obtener_cursor(dictionary=True) as (_, cursor):
        if estado:
            cursor.execute("SELECT COUNT(*) AS total FROM pedidos WHERE estado = %s", (estado,))
        else:
            cursor.execute("SELECT COUNT(*) AS total FROM pedidos")
        total = cursor.fetchone()["total"]

        if estado:
            cursor.execute(
                "SELECT * FROM pedidos WHERE estado = %s ORDER BY id DESC LIMIT %s OFFSET %s",
                (estado, tamano, offset)
            )
        else:
            cursor.execute(
                "SELECT * FROM pedidos ORDER BY id DESC LIMIT %s OFFSET %s",
                (tamano, offset)
            )
        pedidos = cursor.fetchall()

    return {"pedidos": pedidos, "total": total, "pagina": pagina, "tamano": tamano}


@enrutador.get("/pedidos/{id}")
def obtener_pedido(id: int):
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute("SELECT * FROM pedidos WHERE id = %s", (id,))
        pedido = cursor.fetchone()
        if pedido is None:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        cursor.execute("SELECT * FROM detalle_pedidos WHERE pedido_id = %s", (id,))
        pedido["lineas"] = cursor.fetchall()
    return pedido


@enrutador.post("/pedidos", status_code=201)
def crear_pedido(pedido: PedidoNuevo):
    with obtener_cursor(dictionary=True) as (conexion, cursor):
        total = 0
        lineas_con_precio = []

        for linea in pedido.lineas:
            # SELECT FOR UPDATE: bloquea la fila de producto durante la transacción
            # para evitar race condition si dos pedidos llegan al mismo tiempo
            cursor.execute(
                "SELECT precio, stock FROM productos WHERE id = %s FOR UPDATE",
                (linea.producto_id,)
            )
            producto = cursor.fetchone()
            if producto is None:
                raise HTTPException(status_code=404, detail=f"Producto {linea.producto_id} no encontrado")
            if producto["stock"] < linea.cantidad:
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

    return {"id": nuevo_id, "total": round(total, 2), "mensaje": "Pedido creado"}


@enrutador.put("/pedidos/{id}/lineas")
def actualizar_lineas_pedido(id: int, datos: LineasPedido):
    if not datos.lineas:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos una linea")

    with obtener_cursor(dictionary=True) as (conexion, cursor):
        cursor.execute("SELECT id, estado FROM pedidos WHERE id = %s", (id,))
        pedido = cursor.fetchone()
        if pedido is None:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        if pedido["estado"] == "cancelado":
            raise HTTPException(status_code=400, detail="No se pueden editar las líneas de un pedido cancelado")

        # Devolver stock de las líneas actuales antes de reemplazarlas
        cursor.execute("SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = %s", (id,))
        for linea in cursor.fetchall():
            cursor.execute(
                "UPDATE productos SET stock = stock + %s WHERE id = %s",
                (linea["cantidad"], linea["producto_id"])
            )

        cursor.execute("DELETE FROM detalle_pedidos WHERE pedido_id = %s", (id,))

        total = 0
        lineas_con_precio = []
        for linea in datos.lineas:
            # SELECT FOR UPDATE: bloquea la fila para evitar race condition
            cursor.execute(
                "SELECT precio, stock FROM productos WHERE id = %s FOR UPDATE",
                (linea.producto_id,)
            )
            producto = cursor.fetchone()
            if producto is None:
                raise HTTPException(status_code=404, detail=f"Producto {linea.producto_id} no encontrado")
            if producto["stock"] < linea.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para el producto {linea.producto_id} (disponible: {producto['stock']})"
                )
            precio_unitario = producto["precio"]
            total += precio_unitario * linea.cantidad
            lineas_con_precio.append((linea.producto_id, linea.cantidad, precio_unitario))

        for producto_id, cantidad, precio_unitario in lineas_con_precio:
            cursor.execute(
                "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (%s, %s, %s, %s)",
                (id, producto_id, cantidad, precio_unitario)
            )
            cursor.execute(
                "UPDATE productos SET stock = stock - %s WHERE id = %s",
                (cantidad, producto_id)
            )

        cursor.execute("UPDATE pedidos SET total = %s WHERE id = %s", (round(total, 2), id))

    return {"mensaje": "Lineas actualizadas", "total": round(total, 2)}


@enrutador.put("/pedidos/{id}/estado")
def actualizar_estado_pedido(id: int, datos: EstadoPedido):
    with obtener_cursor(dictionary=True) as (conexion, cursor):
        cursor.execute("SELECT estado FROM pedidos WHERE id = %s", (id,))
        pedido = cursor.fetchone()
        if pedido is None:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        # Al cancelar un pedido, devolver el stock de sus líneas
        if datos.estado == "cancelado" and pedido["estado"] != "cancelado":
            cursor.execute(
                "SELECT producto_id, cantidad FROM detalle_pedidos WHERE pedido_id = %s", (id,)
            )
            for linea in cursor.fetchall():
                cursor.execute(
                    "UPDATE productos SET stock = stock + %s WHERE id = %s",
                    (linea["cantidad"], linea["producto_id"])
                )

        cursor.execute("UPDATE pedidos SET estado = %s WHERE id = %s", (datos.estado, id))

    return {"mensaje": "Estado actualizado"}
