// ============================================================
// app.js — Navegacion, modal y utilidades compartidas
// ============================================================

// Mapa de secciones: cada clave es el hash de la URL (#productos)
// y su valor dice que seccion mostrar y que funcion llamar para
// cargar los datos.
const SECCIONES = {
  inicio:     { idSeccion: 'sec-inicio',     cargarDatos: () => {}                 },
  dashboard:  { idSeccion: 'sec-dashboard',  cargarDatos: () => cargarDashboard()  },
  categorias: { idSeccion: 'sec-categorias', cargarDatos: () => cargarCategorias() },
  productos:  { idSeccion: 'sec-productos',  cargarDatos: () => cargarProductos()  },
  clientes:   { idSeccion: 'sec-clientes',   cargarDatos: () => cargarClientes()   },
  pedidos:    { idSeccion: 'sec-pedidos',     cargarDatos: () => cargarPedidos()    },
};

// ----------------------------------------------------------
// NAVEGACION
// ----------------------------------------------------------
function navegarA(hash) {
  const clave = (hash || '').replace('#', '') || 'inicio';

  // Ocultar todas las secciones
  document.querySelectorAll('.seccion').forEach(seccion => seccion.classList.add('oculta'));

  // Quitar clase activo de todos los enlaces
  document.querySelectorAll('.nav-enlace').forEach(enlace => enlace.classList.remove('activo'));

  const configuracion = SECCIONES[clave];
  if (!configuracion) return;

  // Mostrar la seccion correspondiente
  document.getElementById(configuracion.idSeccion).classList.remove('oculta');

  // Marcar el enlace como activo
  const enlaceActivo = document.querySelector(`[data-seccion="${clave}"]`);
  if (enlaceActivo) enlaceActivo.classList.add('activo');

  // Cargar los datos de esa seccion
  configuracion.cargarDatos();
}

// ----------------------------------------------------------
// MODAL
// ----------------------------------------------------------
function abrirModal(titulo, contenidoHtml) {
  document.getElementById('modal-titulo').textContent = titulo;
  document.getElementById('modal-cuerpo').innerHTML = contenidoHtml;
  document.getElementById('modal').classList.remove('oculta');
}

function cerrarModal() {
  document.getElementById('modal').classList.add('oculta');
  document.getElementById('modal-cuerpo').innerHTML = '';
}

// Cerrar modal al hacer clic en el fondo oscuro
document.getElementById('modal').addEventListener('click', function (evento) {
  if (evento.target === this) cerrarModal();
});

// ----------------------------------------------------------
// TOAST (mensaje de notificacion)
// ----------------------------------------------------------
let _temporizadorToast = null;

function mostrarToast(mensaje, tipo = 'exito') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = `toast toast-${tipo}`;

  // Cancelar el temporizador anterior si habia uno activo
  clearTimeout(_temporizadorToast);

  // Ocultar despues de 3 segundos
  _temporizadorToast = setTimeout(() => {
    toast.classList.add('oculta');
  }, 3000);
}

// ----------------------------------------------------------
// SEGURIDAD: escapeHtml
// Convierte caracteres especiales HTML en entidades seguras.
// Se usa siempre que se inserta un dato del servidor dentro de
// un atributo HTML (value="...") o en textContent de la tabla.
// Sin esto, un nombre como  "><script>alert(1)</script>  podria
// ejecutar codigo en el navegador del usuario (XSS).
// ----------------------------------------------------------
function escapeHtml(texto) {
  if (texto === null || texto === undefined) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ----------------------------------------------------------
// BUSCADOR EN TIEMPO REAL
// Conecta un <input> con una tabla: cuando el usuario escribe,
// oculta las filas cuyo textContent no incluye el termino.
// No hace ninguna peticion al servidor — filtra el DOM local.
// ----------------------------------------------------------
function inicializarBuscador(inputId, contenedorTablaId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.addEventListener('input', () => {
    const termino = input.value.toLowerCase().trim();
    const filas = document.querySelectorAll(`#${contenedorTablaId} tbody tr`);
    filas.forEach(fila => {
      const visible = termino === '' || fila.textContent.toLowerCase().includes(termino);
      fila.style.display = visible ? '' : 'none';
    });
  });
}

// ----------------------------------------------------------
// MENSAJE DE ESTADO EN TABLA (cargando, vacio, error)
// ----------------------------------------------------------
function mostrarMensaje(idContenedor, texto, esError = false) {
  document.getElementById(idContenedor).innerHTML = `
    <div class="mensaje-estado ${esError ? 'error' : ''}">
      ${texto}
    </div>
  `;
}

// ----------------------------------------------------------
// FORMATEAR FECHA
// Convierte "2024-01-15 10:30:00" (MySQL) en "15/01/2024".
// ----------------------------------------------------------
function formatearFecha(fechaStr) {
  if (!fechaStr) return '—';
  const fecha = new Date(String(fechaStr).replace(' ', 'T'));
  if (isNaN(fecha)) return fechaStr;
  return fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ----------------------------------------------------------
// CONFIRMAR (modal en lugar del confirm() nativo)
// Uso: confirmar('¿Eliminar este producto?', () => eliminar(id))
// ----------------------------------------------------------
let _confirmarCallback = null;

function confirmar(mensaje, accion) {
  _confirmarCallback = accion;
  abrirModal('Confirmar', `
    <p style="margin-bottom:24px">${escapeHtml(mensaje)}</p>
    <div class="form-botones">
      <button class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-peligro" onclick="_ejecutarConfirmacion()">Aceptar</button>
    </div>
  `);
}

function _ejecutarConfirmacion() {
  cerrarModal();
  if (_confirmarCallback) _confirmarCallback();
  _confirmarCallback = null;
}

// ----------------------------------------------------------
// INICIO DE LA APLICACION
// ----------------------------------------------------------

// Cuando el usuario cambia el hash en la URL (ej: hace clic en un enlace del sidebar)
window.addEventListener('hashchange', () => navegarA(location.hash));

// El evento 'load' ya no navega directamente.
// auth.js se encarga de: mostrar login o app segun haya token,
// y llamar a navegarA() cuando el login es correcto.
