// ============================================================
// api.js — Funciones para hablar con el backend
//
// Estas cuatro funciones envuelven fetch() para que el resto
// del codigo no tenga que repetir siempre los mismos headers
// y el mismo manejo de errores.
// ============================================================

async function obtenerDatos(ruta) {
  const respuesta = await fetch(API_URL + ruta);
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al obtener datos');
  }
  return respuesta.json();
}

async function enviarDatos(ruta, datos) {
  const respuesta = await fetch(API_URL + ruta, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al crear');
  }
  return respuesta.json();
}

async function modificarDatos(ruta, datos) {
  const respuesta = await fetch(API_URL + ruta, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos)
  });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al actualizar');
  }
  return respuesta.json();
}

async function borrarDatos(ruta) {
  const respuesta = await fetch(API_URL + ruta, { method: 'DELETE' });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({ detail: respuesta.statusText }));
    throw new Error(error.detail || 'Error al eliminar');
  }
  return respuesta.json();
}
