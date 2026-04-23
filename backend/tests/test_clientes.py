"""
Tests unitarios para el router de clientes.
"""
from unittest.mock import patch
from .conftest import cursor_mock


CLIENTE_EJEMPLO = {
    "id": 1,
    "nombre": "Carlos Test",
    "email": "carlos@test.com",
    "telefono": "612345678",
    "direccion": "Calle Test 1, Madrid",
    "fecha_registro": "2024-01-15",
}


def test_listar_clientes(client):
    with patch("routers.clientes.obtener_cursor", cursor_mock(fetchall=[CLIENTE_EJEMPLO])):
        resp = client.get("/clientes")
    assert resp.status_code == 200
    assert resp.json()[0]["email"] == "carlos@test.com"


def test_obtener_cliente_existente(client):
    with patch("routers.clientes.obtener_cursor", cursor_mock(fetchone=CLIENTE_EJEMPLO)):
        resp = client.get("/clientes/1")
    assert resp.status_code == 200


def test_obtener_cliente_no_encontrado(client):
    with patch("routers.clientes.obtener_cursor", cursor_mock(fetchone=None)):
        resp = client.get("/clientes/999")
    assert resp.status_code == 404


def test_crear_cliente(client):
    nuevo = {"nombre": "Nuevo Cliente", "email": "nuevo@test.com"}
    with patch("routers.clientes.obtener_cursor", cursor_mock(lastrowid=5)):
        resp = client.post("/clientes", json=nuevo)
    assert resp.status_code == 201
    assert resp.json()["id"] == 5


def test_crear_cliente_sin_email_da_422(client):
    resp = client.post("/clientes", json={"nombre": "Sin Email"})
    assert resp.status_code == 422


def test_actualizar_cliente(client):
    with patch("routers.clientes.obtener_cursor", cursor_mock(rowcount=1)):
        resp = client.put("/clientes/1", json={"telefono": "699999999"})
    assert resp.status_code == 200


def test_actualizar_cliente_no_encontrado(client):
    with patch("routers.clientes.obtener_cursor", cursor_mock(rowcount=0)):
        resp = client.put("/clientes/999", json={"nombre": "Nadie"})
    assert resp.status_code == 404


def test_eliminar_cliente(client):
    with patch("routers.clientes.obtener_cursor", cursor_mock(rowcount=1)):
        resp = client.delete("/clientes/1")
    assert resp.status_code == 200


def test_eliminar_cliente_no_encontrado(client):
    with patch("routers.clientes.obtener_cursor", cursor_mock(rowcount=0)):
        resp = client.delete("/clientes/999")
    assert resp.status_code == 404


def test_pedidos_de_cliente(client):
    pedidos = [{"id": 1, "cliente_id": 1, "fecha": "2024-03-10",
                "estado": "entregado", "total": 286.69}]
    with patch("routers.clientes.obtener_cursor",
               cursor_mock(fetchone=CLIENTE_EJEMPLO, fetchall=pedidos)):
        resp = client.get("/clientes/1/pedidos")
    assert resp.status_code == 200
