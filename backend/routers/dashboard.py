from fastapi import APIRouter
from database import obtener_cursor

enrutador = APIRouter()


@enrutador.get("/dashboard")
def obtener_estadisticas():
    """
    Devuelve todos los KPIs necesarios para el panel de control:
      - Totales globales (pedidos, ventas, clientes, productos)
      - Caja diaria: ingresos y pedidos del día actual
      - Comparativas: ayer, semana anterior, mes anterior
      - Ticket medio del día frente al día anterior
      - Top 5 productos más vendidos con unidades e importe
      - Productos con stock bajo y evolución mensual (gráfica)
    """
    with obtener_cursor(dictionary=True) as (_, cursor):

        # ── Totales históricos globales ───────────────────────────────────────
        cursor.execute("SELECT COUNT(*) AS total, COALESCE(SUM(total), 0) AS ventas FROM pedidos")
        pedidos_info = cursor.fetchone()

        cursor.execute("SELECT COUNT(*) AS total FROM clientes")
        total_clientes = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) AS total FROM productos")
        total_productos = cursor.fetchone()["total"]

        # ── Caja diaria ───────────────────────────────────────────────────────
        cursor.execute("""
            SELECT
                COUNT(*) AS pedidos_hoy,
                ROUND(COALESCE(SUM(total), 0), 2) AS ventas_hoy
            FROM pedidos
            WHERE fecha = CURDATE()
        """)
        hoy = cursor.fetchone()

        # ── Ayer ──────────────────────────────────────────────────────────────
        cursor.execute("""
            SELECT
                COUNT(*) AS pedidos_ayer,
                ROUND(COALESCE(SUM(total), 0), 2) AS ventas_ayer
            FROM pedidos
            WHERE fecha = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        """)
        ayer = cursor.fetchone()

        # ── Semana actual ─────────────────────────────────────────────────────
        cursor.execute("""
            SELECT ROUND(COALESCE(SUM(total), 0), 2) AS ventas_semana
            FROM pedidos
            WHERE YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)
        """)
        semana_actual = cursor.fetchone()

        # ── Semana anterior ───────────────────────────────────────────────────
        cursor.execute("""
            SELECT ROUND(COALESCE(SUM(total), 0), 2) AS ventas_semana_anterior
            FROM pedidos
            WHERE YEARWEEK(fecha, 1) = YEARWEEK(DATE_SUB(CURDATE(), INTERVAL 7 DAY), 1)
        """)
        semana_ant = cursor.fetchone()

        # ── Mes actual ────────────────────────────────────────────────────────
        cursor.execute("""
            SELECT ROUND(COALESCE(SUM(total), 0), 2) AS ventas_mes_actual
            FROM pedidos
            WHERE YEAR(fecha) = YEAR(CURDATE())
              AND MONTH(fecha) = MONTH(CURDATE())
        """)
        mes_actual = cursor.fetchone()

        # ── Mes anterior ──────────────────────────────────────────────────────
        cursor.execute("""
            SELECT ROUND(COALESCE(SUM(total), 0), 2) AS ventas_mes_anterior
            FROM pedidos
            WHERE YEAR(fecha) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
              AND MONTH(fecha) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        """)
        mes_ant = cursor.fetchone()

        # ── Ticket medio ──────────────────────────────────────────────────────
        cursor.execute("""
            SELECT
                ROUND(COALESCE(
                    AVG(CASE WHEN fecha = CURDATE() THEN total END), 0
                ), 2) AS ticket_hoy,
                ROUND(COALESCE(
                    AVG(CASE WHEN fecha = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN total END), 0
                ), 2) AS ticket_ayer
            FROM pedidos
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        """)
        tickets = cursor.fetchone()

        # ── Stock bajo ────────────────────────────────────────────────────────
        cursor.execute("""
            SELECT id, nombre, stock, stock_minimo, marca
            FROM productos
            WHERE stock <= stock_minimo
            ORDER BY stock ASC
        """)
        stock_bajo = cursor.fetchall()

        # ── Evolución mensual (últimos 6 meses) ───────────────────────────────
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

        # ── Top 5 productos más vendidos ──────────────────────────────────────
        cursor.execute("""
            SELECT
                p.nombre,
                SUM(dp.cantidad) AS unidades_vendidas,
                ROUND(SUM(dp.cantidad * dp.precio_unitario), 2) AS importe_generado
            FROM detalle_pedidos dp
            JOIN productos p ON p.id = dp.producto_id
            GROUP BY dp.producto_id, p.nombre
            ORDER BY unidades_vendidas DESC
            LIMIT 5
        """)
        top_productos = cursor.fetchall()

    return {
        "total_pedidos":           pedidos_info["total"],
        "total_ventas":            float(pedidos_info["ventas"]),
        "total_clientes":          total_clientes,
        "total_productos":         total_productos,
        "pedidos_hoy":             hoy["pedidos_hoy"],
        "ventas_hoy":              float(hoy["ventas_hoy"]),
        "pedidos_ayer":            ayer["pedidos_ayer"],
        "ventas_ayer":             float(ayer["ventas_ayer"]),
        "ventas_semana":           float(semana_actual["ventas_semana"]),
        "ventas_semana_anterior":  float(semana_ant["ventas_semana_anterior"]),
        "ventas_mes_actual":       float(mes_actual["ventas_mes_actual"]),
        "ventas_mes_anterior":     float(mes_ant["ventas_mes_anterior"]),
        "ticket_medio_hoy":        float(tickets["ticket_hoy"]),
        "ticket_medio_ayer":       float(tickets["ticket_ayer"]),
        "stock_bajo":              stock_bajo,
        "ventas_por_mes": [
            {
                "mes":          v["mes"],
                "num_pedidos":  v["num_pedidos"],
                "total_ventas": float(v["total_ventas"]),
            }
            for v in ventas_mes
        ],
        "top_productos": [
            {
                "nombre":            t["nombre"],
                "unidades_vendidas": t["unidades_vendidas"],
                "importe_generado":  float(t["importe_generado"]),
            }
            for t in top_productos
        ],
    }
