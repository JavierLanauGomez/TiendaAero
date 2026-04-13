from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from database import obtener_conexion
from auth import verificar_contrasena, crear_token

enrutador = APIRouter(prefix="/auth", tags=["autenticacion"])


@enrutador.post("/login")
def login(datos: OAuth2PasswordRequestForm = Depends()):
    """
    Recibe usuario y contraseña (formato form-data, estandar OAuth2).
    Devuelve un JWT si las credenciales son correctas.

    El cliente debe guardar el token y enviarlo en futuras peticiones:
      Authorization: Bearer <token>
    """
    conexion = obtener_conexion()
    cursor   = conexion.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM usuarios WHERE nombre_usuario = %s",
        (datos.username,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conexion.close()

    # Verificamos que el usuario existe Y que la contraseña es correcta.
    # Hacemos las dos comprobaciones antes de responder para no dar pistas
    # a un atacante sobre si el usuario existe o no.
    if not usuario or not verificar_contrasena(datos.password, usuario["contrasena_hash"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")

    token = crear_token(usuario["nombre_usuario"])
    # La respuesta sigue el estandar OAuth2: access_token + token_type
    return {"access_token": token, "token_type": "bearer"}
