import os
from contextlib import contextmanager

import mysql.connector
from dotenv import load_dotenv

load_dotenv(override=True)


def obtener_conexion():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


@contextmanager
def obtener_cursor(dictionary=False):
    """
    Context manager que garantiza el cierre de cursor y conexión,
    hace commit automático en éxito y rollback en caso de excepción.

    Uso básico (lectura o escritura simple):
        with obtener_cursor(dictionary=True) as (_, cursor):
            cursor.execute("SELECT * FROM productos")
            return cursor.fetchall()

    Uso con acceso a la conexión (transacciones manuales):
        with obtener_cursor(dictionary=True) as (conexion, cursor):
            cursor.execute(...)
            conexion.commit()   # commit explícito dentro de la transacción
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor(dictionary=dictionary)
    try:
        yield conexion, cursor
        conexion.commit()
    except Exception:
        conexion.rollback()
        raise
    finally:
        cursor.close()
        conexion.close()
