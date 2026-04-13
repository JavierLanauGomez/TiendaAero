from fastapi import APIRouter
from database import obtener_conexion

enrutador = APIRouter()


@enrutador.get("/dashboard")
def obtener_estadisticas():
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS ventas FROM pedidos")
    pedidos_info = cursor.fetchone()

    cursor.execute("SELECT COUNT(*) AS total FROM clientes")
    total_clientes = cursor.fetchone()["total"]

    cursor.execute("SELECT COUNT(*) AS total FROM productos")
    total_productos = cursor.fetchone()["total"]

    cursor.execute("""
        SELECT id, nombre, stock, stock_minimo, marca
        FROM productos
        WHERE stock <= stock_minimo
        ORDER BY stock ASC
    """)
    stock_bajo = cursor.fetchall()

    cursor.execute("""
        SELECT
            DATE_FORMAT(fecha, '%Y-%m') AS mes,
            COUNT(*) AS num_pedidos,
            ROUND(COALESCE(SUM(total), 0), 2) AS total_ventas
        FROM pedidos
        WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY mes
        ORDER BY mes ASC
    """)
    ventas_mes = cursor.fetchall()

    cursor.execute("""
        SELECT p.nombre, SUM(dp.cantidad) AS unidades_vendidas
        FROM detalle_pedidos dp
        JOIN productos p ON p.id = dp.producto_id
        GROUP BY dp.producto_id, p.nombre
        ORDER BY unidades_vendidas DESC
        LIMIT 5
    """)
    top_productos = cursor.fetchall()

    cursor.close()
    conexion.close()

    return {
        "total_pedidos": pedidos_info["total"],
        "total_ventas": float(pedidos_info["ventas"]),
        "total_clientes": total_clientes,
        "total_productos": total_productos,
        "stock_bajo": stock_bajo,
        "ventas_por_mes": [
            {
                "mes": v["mes"],
                "num_pedidos": v["num_pedidos"],
                "total_ventas": float(v["total_ventas"]),
            }
            for v in ventas_mes
        ],
        "top_productos": [
            {"nombre": t["nombre"], "unidades_vendidas": t["unidades_vendidas"]}
            for t in top_productos
        ],
    }
