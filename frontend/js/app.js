// ============================================================
// app.js — Navegacion, modal y utilidades compartidas
// ============================================================

// Mapa de secciones: cada clave es el hash de la URL (#productos)
// y su valor dice que seccion mostrar y que funcion llamar para
// cargar los datos.
const SECCIONES = {
  categorias: { idSeccion: 'sec-categorias', cargarDatos: () => cargarCategorias() },
  productos:  { idSeccion: 'sec-productos',  cargarDatos: () => cargarProductos()  },
  clientes:   { idSeccion: 'sec-clientes',   cargarDatos: () => cargarClientes()   },
  pedidos:    { idSeccion: 'sec-pedidos',     cargarDatos: () => cargarPedidos()    },
};

// ----------------------------------------------------------
// NAVEGACION
// ----------------------------------------------------------
function navegarA(hash) {
  const clave = (hash || '').replace('#', '') || 'categorias';

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
// INICIO DE LA APLICACION
// ----------------------------------------------------------

// Cuando el usuario cambia el hash en la URL (ej: hace clic en un enlace del sidebar)
window.addEventListener('hashchange', () => navegarA(location.hash));

// Cuando se carga la pagina por primera vez
window.addEventListener('load', () => {
  if (!location.hash) location.hash = '#categorias';
  navegarA(location.hash);
});
