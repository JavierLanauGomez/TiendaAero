import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

# -------------------------------------------------------------------
# Configuracion JWT
# -------------------------------------------------------------------
CLAVE_SECRETA      = os.getenv("JWT_SECRET", "clave_por_defecto_CAMBIAR")
ALGORITMO          = "HS256"
MINUTOS_EXPIRACION = 60 * 8   # el token dura 8 horas

# -------------------------------------------------------------------
# Herramientas de contraseña y token
# -------------------------------------------------------------------

# CryptContext gestiona el hashing con bcrypt
contexto_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2PasswordBearer le dice a FastAPI donde esta el endpoint de login
# y que cabecera HTTP espera: "Authorization: Bearer <token>"
esquema_oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")


def verificar_contrasena(plana: str, hashed: str) -> bool:
    """Comprueba que una contraseña en texto plano coincide con su hash."""
    return contexto_pwd.verify(plana, hashed)


def hashear_contrasena(contrasena: str) -> str:
    """Devuelve el hash bcrypt de una contraseña."""
    return contexto_pwd.hash(contrasena)


def crear_token(nombre_usuario: str) -> str:
    """Genera un JWT firmado que expira en MINUTOS_EXPIRACION."""
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=MINUTOS_EXPIRACION)
    payload = {"sub": nombre_usuario, "exp": expiracion}
    return jwt.encode(payload, CLAVE_SECRETA, algorithm=ALGORITMO)


def obtener_usuario_actual(token: str = Depends(esquema_oauth2)) -> str:
    """
    Dependencia de FastAPI: extrae y valida el token del header Authorization.
    Se usa en los routers para proteger endpoints:
      def mi_endpoint(usuario = Depends(obtener_usuario_actual)):
    Si el token no es valido o expiro, FastAPI devuelve HTTP 401 automaticamente.
    """
    try:
        payload = jwt.decode(token, CLAVE_SECRETA, algorithms=[ALGORITMO])
        usuario: str = payload.get("sub")
        if usuario is None:
            raise HTTPException(status_code=401, detail="Token invalido")
        return usuario
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalido o expirado")
