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
  mostrarLogin();
}

function mostrarLogin() {
  document.getElementById('panel-login').classList.remove('oculta');
  document.getElementById('panel-registro').classList.add('oculta');
  document.getElementById('login-usuario').value = '';
  document.getElementById('login-contrasena').value = '';
  document.getElementById('login-error').textContent = '';
}

function mostrarRegistro() {
  document.getElementById('panel-login').classList.add('oculta');
  document.getElementById('panel-registro').classList.remove('oculta');
  document.getElementById('reg-usuario').value = '';
  document.getElementById('reg-contrasena').value = '';
  document.getElementById('reg-contrasena2').value = '';
  document.getElementById('reg-error').textContent = '';
  document.getElementById('reg-exito').textContent = '';
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
    location.hash = '#inicio';
    navegarA('#inicio');

  } catch (_) {
    errorDiv.textContent = 'No se puede conectar con el servidor';
  }
}

// ----------------------------------------------------------
// SUBMIT DEL FORMULARIO DE REGISTRO
// ----------------------------------------------------------
async function enviarRegistro(evento) {
  evento.preventDefault();

  const usuario     = document.getElementById('reg-usuario').value.trim();
  const contrasena  = document.getElementById('reg-contrasena').value;
  const contrasena2 = document.getElementById('reg-contrasena2').value;
  const errorDiv    = document.getElementById('reg-error');
  const exitoDiv    = document.getElementById('reg-exito');

  errorDiv.textContent = '';
  exitoDiv.textContent = '';

  if (contrasena !== contrasena2) {
    errorDiv.textContent = 'Las contraseñas no coinciden';
    return;
  }

  try {
    const respuesta = await fetch(API_URL + '/auth/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre_usuario: usuario, contrasena })
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      errorDiv.textContent = datos.detail || 'Error al crear el usuario';
      return;
    }

    exitoDiv.textContent = 'Usuario creado. Ahora puedes iniciar sesion.';
    setTimeout(() => mostrarLogin(), 1500);

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
    navegarA(location.hash || '#inicio');
  } else {
    mostrarPantallaLogin();
  }
});
