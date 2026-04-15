from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from database import obtener_cursor
from auth import verificar_contrasena, crear_token, hashear_contrasena

enrutador = APIRouter(prefix="/auth", tags=["autenticacion"])


class DatosRegistro(BaseModel):
    nombre_usuario: str
    contrasena: str


@enrutador.post("/registro", status_code=201)
def registro(datos: DatosRegistro):
    """
    Crea un nuevo usuario. Devuelve error 409 si el nombre de usuario ya existe.
    """
    if not datos.nombre_usuario.strip() or not datos.contrasena:
        raise HTTPException(status_code=422, detail="Usuario y contraseña son obligatorios")

    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute(
            "SELECT id FROM usuarios WHERE nombre_usuario = %s",
            (datos.nombre_usuario,)
        )
        if cursor.fetchone():
            raise HTTPException(status_code=409, detail="El nombre de usuario ya existe")

        hash_contrasena = hashear_contrasena(datos.contrasena)
        cursor.execute(
            "INSERT INTO usuarios (nombre_usuario, contrasena_hash) VALUES (%s, %s)",
            (datos.nombre_usuario, hash_contrasena)
        )

    return {"mensaje": "Usuario creado correctamente"}


@enrutador.post("/login")
def login(datos: OAuth2PasswordRequestForm = Depends()):
    """
    Recibe usuario y contraseña (formato form-data, estandar OAuth2).
    Devuelve un JWT si las credenciales son correctas.

    El cliente debe guardar el token y enviarlo en futuras peticiones:
      Authorization: Bearer <token>
    """
    with obtener_cursor(dictionary=True) as (_, cursor):
        cursor.execute(
            "SELECT * FROM usuarios WHERE nombre_usuario = %s",
            (datos.username,)
        )
        usuario = cursor.fetchone()

    # Verificamos que el usuario existe Y que la contraseña es correcta.
    # Hacemos las dos comprobaciones antes de responder para no dar pistas
    # a un atacante sobre si el usuario existe o no.
    if not usuario or not verificar_contrasena(datos.password, usuario["contrasena_hash"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    ficha = crear_token(usuario["nombre_usuario"])
    # La respuesta sigue el estandar OAuth2: access_token + token_type
    return {"access_token": ficha, "token_type": "bearer"}
