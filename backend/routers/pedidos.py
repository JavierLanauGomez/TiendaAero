from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Literal
from database import get_conexion

router = APIRouter()


class LineaPedido(BaseModel):
    producto_id: int
    cantidad:    int


class PedidoNuevo(BaseModel):
    cliente_id: int
    lineas:     list[LineaPedido]


class EstadoPedido(BaseModel):
    estado: Literal["pendiente", "enviado", "entregado"]


@router.get("/pedidos")
def listar_pedidos():
    conexion = get_conexion()
    cursor = conexion.cursor(dictionary=True)
    cursor.execute("SELECT * FROM pedidos")
    pedidos = cursor.fetchall()
    cursor.close()
    conexion.close()
    return pedidos


@router.get("/pedidos/{id}")
def obtener_pedido(id: int):
    conexion = get_conexion()
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


@router.post("/pedidos", status_code=201)
def crear_pedido(pedido: PedidoNuevo):
    conexion = get_conexion()
    cursor = conexion.cursor(dictionary=True)

    total = 0
    lineas_con_precio = []
    for linea in pedido.lineas:
        cursor.execute("SELECT precio FROM productos WHERE id = %s", (linea.producto_id,))
        producto = cursor.fetchone()
        if producto is None:
            cursor.close()
            conexion.close()
            raise HTTPException(status_code=404, detail=f"Producto {linea.producto_id} no encontrado")
        precio = producto["precio"]
        total += precio * linea.cantidad
        lineas_con_precio.append((linea.producto_id, linea.cantidad, precio))

    cursor.execute(
        "INSERT INTO pedidos (cliente_id, total) VALUES (%s, %s)",
        (pedido.cliente_id, round(total, 2))
    )
    pedido_id = cursor.lastrowid

    for producto_id, cantidad, precio in lineas_con_precio:
        cursor.execute(
            "INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario) VALUES (%s, %s, %s, %s)",
            (pedido_id, producto_id, cantidad, precio)
        )

    conexion.commit()
    cursor.close()
    conexion.close()
    return {"id": pedido_id, "total": round(total, 2), "mensaje": "Pedido creado"}


@router.put("/pedidos/{id}/estado")
def actualizar_estado_pedido(id: int, datos: EstadoPedido):
    conexion = get_conexion()
    cursor = conexion.cursor()
    cursor.execute("UPDATE pedidos SET estado = %s WHERE id = %s", (datos.estado, id))
    conexion.commit()
    afectadas = cursor.rowcount
    cursor.close()
    conexion.close()
    if afectadas == 0:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return {"mensaje": "Estado actualizado"}
