"""
crear_admin.py — Script de un solo uso para crear el usuario administrador.

Uso:
    python crear_admin.py

Se ejecuta UNA VEZ despues de crear la base de datos. Pide nombre de usuario
y contraseña por consola, genera el hash bcrypt y lo inserta en la tabla usuarios.
"""

import sys
import getpass
from database import obtener_conexion
from auth import hashear_contrasena


def main():
    print("=== Crear usuario administrador ===\n")

    nombre = input("Nombre de usuario: ").strip()
    if not nombre:
        print("El nombre no puede estar vacio.")
        sys.exit(1)

    contrasena = getpass.getpass("Contraseña: ")
    if len(contrasena) < 6:
        print("La contraseña debe tener al menos 6 caracteres.")
        sys.exit(1)

    confirmacion = getpass.getpass("Repetir contraseña: ")
    if contrasena != confirmacion:
        print("Las contraseñas no coinciden.")
        sys.exit(1)

    hash_ = hashear_contrasena(contrasena)

    try:
        conexion = obtener_conexion()
        cursor   = conexion.cursor()
        cursor.execute(
            "INSERT INTO usuarios (nombre_usuario, contrasena_hash) VALUES (%s, %s)",
            (nombre, hash_)
        )
        conexion.commit()
        cursor.close()
        conexion.close()
        print(f"\nUsuario '{nombre}' creado correctamente.")
    except Exception as e:
        print(f"\nError al crear el usuario: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
