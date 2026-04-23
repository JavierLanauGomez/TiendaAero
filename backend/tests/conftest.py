"""
Fixtures compartidos para todos los tests de TiendaAero.

Estrategia:
  - Se anula la dependencia JWT para que los tests no necesiten token real.
  - La base de datos se mockea en cada test con unittest.mock.patch,
    evitando depender de una BD real durante las pruebas.
"""
import sys
import os
from contextlib import contextmanager
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from main import aplicacion
from auth import obtener_usuario_actual


def _usuario_ficticio():
    return {"nombre_usuario": "test_admin"}


# Bypass de autenticación JWT para todos los tests
aplicacion.dependency_overrides[obtener_usuario_actual] = _usuario_ficticio


@pytest.fixture
def client():
    with TestClient(aplicacion) as c:
        yield c


def cursor_mock(fetchall=None, fetchone=None, rowcount=1, lastrowid=1):
    """
    Devuelve un contextmanager que simula obtener_cursor.
    Uso:
        with patch("routers.socios.obtener_cursor", cursor_mock(fetchall=[...])):
            resp = client.get("/socios")
    """
    @contextmanager
    def _cm(dictionary=False):
        conn = MagicMock()
        cur  = MagicMock()
        cur.rowcount  = rowcount
        cur.lastrowid = lastrowid
        if fetchall is not None:
            cur.fetchall.return_value = fetchall
        if fetchone is not None:
            if isinstance(fetchone, list):
                cur.fetchone.side_effect = fetchone
            else:
                cur.fetchone.return_value = fetchone
        yield conn, cur
    return _cm
