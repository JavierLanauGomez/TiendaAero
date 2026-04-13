// ============================================================
// auth.js — Login, logout y gestion del token JWT
//
// El token se guarda en localStorage bajo la clave "token".
// Todas las peticiones a la API deben incluirlo en la cabecera:
//   Authorization: Bearer <token>
// ============================================================

const CLAVE_TOKEN = 'tiendaaero_token';

// Devuelve el token guardado, o null si no hay sesion activa
function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

// Guarda el token tras un login correcto
function guardarToken(token) {
  localStorage.setItem(CLAVE_TOKEN, token);
}

// Borra el token y vuelve a mostrar la pantalla de login
function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  mostrarPantallaLogin();
}

// ----------------------------------------------------------
// PANTALLA DE LOGIN
// ----------------------------------------------------------
function mostrarPantallaLogin() {
  document.getElementById('app').classList.add('oculta');
  document.getElementById('pantalla-login').classList.remove('oculta');
  // Limpiar el formulario por si habia datos de antes
  document.getElementById('login-usuario').value = '';
  document.getElementById('login-contrasena').value = '';
  document.getElementById('login-error').textContent = '';
}

function mostrarApp() {
  document.getElementById('pantalla-login').classList.add('oculta');
  document.getElementById('app').classList.remove('oculta');
}

// ----------------------------------------------------------
// SUBMIT DEL FORMULARIO DE LOGIN
// ----------------------------------------------------------
async function enviarLogin(evento) {
  evento.preventDefault();

  const usuario    = document.getElementById('login-usuario').value.trim();
  const contrasena = document.getElementById('login-contrasena').value;
  const errorDiv   = document.getElementById('login-error');

  errorDiv.textContent = '';

  // La API de login espera form-data (estandar OAuth2), no JSON
  const cuerpo = new URLSearchParams({ username: usuario, password: contrasena });

  try {
    const respuesta = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: cuerpo.toString()
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));
      errorDiv.textContent = datos.detail || 'Usuario o contraseña incorrectos';
      return;
    }

    const datos = await respuesta.json();
    guardarToken(datos.access_token);
    mostrarApp();

    // Arrancar la navegacion ahora que tenemos sesion
    if (!location.hash) location.hash = '#categorias';
    navegarA(location.hash);

  } catch (_) {
    errorDiv.textContent = 'No se puede conectar con el servidor';
  }
}

// ----------------------------------------------------------
// ARRANQUE: decidir si mostrar login o app directamente
// ----------------------------------------------------------
window.addEventListener('load', () => {
  if (obtenerToken()) {
    mostrarApp();
  } else {
    mostrarPantallaLogin();
  }
});
