"""
Tests unitarios para el router de socios (GET, POST, PUT, DELETE, estadísticas).
La base de datos se mockea completamente — no se necesita MySQL en marcha.
"""
from unittest.mock import patch
from .conftest import cursor_mock


SOCIO_EJEMPLO = {
    "id": 1,
    "nombre": "Pedro Test",
    "email": "pedro@test.com",
    "telefono": "611000001",
    "fecha_alta": "2025-01-15",
    "estado": "activo",
    "fecha_baja": None,
}

STATS_EJEMPLO = {
    "activos": 10,
    "bajas_anio": 2,
    "altas_mes": 3,
}


# ── GET /socios ──────────────────────────────────────────────────────────────

def test_listar_socios_devuelve_lista(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(fetchall=[SOCIO_EJEMPLO])):
        resp = client.get("/socios")
    assert resp.status_code == 200
    datos = resp.json()
    assert isinstance(datos, list)
    assert datos[0]["nombre"] == "Pedro Test"


def test_listar_socios_vacio(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(fetchall=[])):
        resp = client.get("/socios")
    assert resp.status_code == 200
    assert resp.json() == []


# ── GET /socios/estadisticas ─────────────────────────────────────────────────

def test_estadisticas_devuelve_tres_metricas(client):
    # El endpoint hace 3 llamadas a fetchone consecutivas
    with patch("routers.socios.obtener_cursor",
               cursor_mock(fetchone=[{"total": 10}, {"total": 2}, {"total": 3}])):
        resp = client.get("/socios/estadisticas")
    assert resp.status_code == 200
    body = resp.json()
    assert "activos"    in body
    assert "bajas_anio" in body
    assert "altas_mes"  in body
    assert body["activos"]    == 10
    assert body["bajas_anio"] == 2
    assert body["altas_mes"]  == 3


def test_estadisticas_con_cero_socios(client):
    with patch("routers.socios.obtener_cursor",
               cursor_mock(fetchone=[{"total": 0}, {"total": 0}, {"total": 0}])):
        resp = client.get("/socios/estadisticas")
    assert resp.status_code == 200
    body = resp.json()
    assert body["activos"] == 0


# ── GET /socios/{id} ─────────────────────────────────────────────────────────

def test_obtener_socio_existente(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(fetchone=SOCIO_EJEMPLO)):
        resp = client.get("/socios/1")
    assert resp.status_code == 200
    assert resp.json()["email"] == "pedro@test.com"


def test_obtener_socio_no_encontrado(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(fetchone=None)):
        resp = client.get("/socios/999")
    assert resp.status_code == 404
    assert "no encontrado" in resp.json()["detail"].lower()


# ── POST /socios ─────────────────────────────────────────────────────────────

def test_crear_socio_correcto(client):
    nuevo = {"nombre": "Nuevo Socio", "email": "nuevo@test.com", "telefono": "699000001"}
    with patch("routers.socios.obtener_cursor", cursor_mock(lastrowid=42)):
        resp = client.post("/socios", json=nuevo)
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] == 42
    assert "creado" in body["mensaje"].lower()


def test_crear_socio_sin_nombre_da_422(client):
    resp = client.post("/socios", json={"email": "sin_nombre@test.com"})
    assert resp.status_code == 422


def test_crear_socio_sin_email_da_422(client):
    resp = client.post("/socios", json={"nombre": "Sin Email"})
    assert resp.status_code == 422


# ── PUT /socios/{id} ─────────────────────────────────────────────────────────

def test_actualizar_socio_existente(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(rowcount=1)):
        resp = client.put("/socios/1", json={"nombre": "Nombre Actualizado"})
    assert resp.status_code == 200
    assert "actualizado" in resp.json()["mensaje"].lower()


def test_actualizar_socio_no_encontrado(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(rowcount=0)):
        resp = client.put("/socios/999", json={"nombre": "Nadie"})
    assert resp.status_code == 404


def test_actualizar_sin_campos_da_400(client):
    with patch("routers.socios.obtener_cursor", cursor_mock()):
        resp = client.put("/socios/1", json={})
    assert resp.status_code == 400


def test_dar_de_baja_actualiza_estado(client):
    payload = {"estado": "baja", "fecha_baja": "2026-04-20"}
    with patch("routers.socios.obtener_cursor", cursor_mock(rowcount=1)):
        resp = client.put("/socios/1", json=payload)
    assert resp.status_code == 200


# ── DELETE /socios/{id} ──────────────────────────────────────────────────────

def test_eliminar_socio_existente(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(rowcount=1)):
        resp = client.delete("/socios/1")
    assert resp.status_code == 200
    assert "eliminado" in resp.json()["mensaje"].lower()


def test_eliminar_socio_no_encontrado(client):
    with patch("routers.socios.obtener_cursor", cursor_mock(rowcount=0)):
        resp = client.delete("/socios/999")
    assert resp.status_code == 404
