// ============================================================
// api.js — Funciones para hablar con el backend
//
// Estas cuatro funciones envuelven fetch() para que el resto
// del codigo no tenga que repetir siempre los mismos headers,
// el token JWT y el manejo de errores.
// ============================================================

// Cabeceras comunes para peticiones con cuerpo JSON + token JWT
function _cabeceras() {
  const token = obtenerToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// Cabeceras para peticiones sin cuerpo (GET y DELETE) + token JWT
function _cabecerasSimples() {
  const token = obtenerToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Gestiona respuestas 401: si el token expiro, cierra sesion automaticamente
function _manejarRespuesta(respuesta) {
  if (respuesta.status === 401) {
    cerrarSesion();
    throw new Error('Sesion expirada. Por favor, vuelve a iniciar sesion.');
  }
  return respuesta;
}

async function obtenerDatos(ruta) {
  const respuesta = _manejarRespuesta(
    await fetch(API_URL + ruta, { headers: _cabecerasSimples() })
  );
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al obtener datos');
  }
  return respuesta.json();
}

async function enviarDatos(ruta, datos) {
  const respuesta = _manejarRespuesta(
    await fetch(API_URL + ruta, {
      method: 'POST',
      headers: _cabeceras(),
      body: JSON.stringify(datos)
    })
  );
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al crear');
  }
  return respuesta.json();
}

async function modificarDatos(ruta, datos) {
  const respuesta = _manejarRespuesta(
    await fetch(API_URL + ruta, {
      method: 'PUT',
      headers: _cabeceras(),
      body: JSON.stringify(datos)
    })
  );
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al actualizar');
  }
  return respuesta.json();
}

async function borrarDatos(ruta) {
  const respuesta = _manejarRespuesta(
    await fetch(API_URL + ruta, { method: 'DELETE', headers: _cabecerasSimples() })
  );
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al eliminar');
  }
  return respuesta.json();
}
