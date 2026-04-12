// ============================================================
// categorias.js — CRUD de categorias
// ============================================================

// Cache local: guardamos las categorias para no tener que
// volver a pedirlas al servidor cuando abrimos el formulario.
var _categorias = [];

// ----------------------------------------------------------
// CARGAR Y MOSTRAR TABLA
// ----------------------------------------------------------
async function cargarCategorias() {
  mostrarMensaje('tabla-categorias', 'Cargando...');
  try {
    _categorias = await obtenerDatos('/categorias');

    if (_categorias.length === 0) {
      mostrarMensaje('tabla-categorias', 'No hay categorias todavia.');
      return;
    }

    // Construimos la tabla como texto HTML y la metemos en el div
    document.getElementById('tabla-categorias').innerHTML = `
      <table class="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripcion</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${_categorias.map(categoria => `
            <tr>
              <td>${categoria.id}</td>
              <td>${categoria.nombre}</td>
              <td>${categoria.descripcion || '—'}</td>
              <td class="acciones">
                <button class="btn btn-secundario btn-sm"
                        onclick="abrirFormCategoria(${categoria.id})">Editar</button>
                <button class="btn btn-peligro btn-sm"
                        onclick="eliminarCategoria(${categoria.id})">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    mostrarMensaje('tabla-categorias', 'Error: ' + error.message, true);
  }
}

// ----------------------------------------------------------
// ABRIR FORMULARIO (crear o editar)
// ----------------------------------------------------------
function abrirFormCategoria(id) {
  // Si nos pasan un id, buscamos la categoria en la cache
  const categoria = id ? _categorias.find(c => c.id === id) : null;
  const titulo = categoria ? 'Editar categoria' : 'Nueva categoria';

  abrirModal(titulo, `
    <form onsubmit="guardarCategoria(event, ${id || ''})">
      <div class="campo">
        <label>Nombre *</label>
        <input type="text" id="cat-nombre" required
               value="${categoria ? categoria.nombre : ''}">
      </div>
      <div class="campo">
        <label>Descripcion</label>
        <input type="text" id="cat-descripcion"
               value="${categoria && categoria.descripcion ? categoria.descripcion : ''}">
      </div>
      <div class="form-botones">
        <button type="button" class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Guardar</button>
      </div>
    </form>
  `);
}

// ----------------------------------------------------------
// GUARDAR (POST o PUT segun si hay id)
// ----------------------------------------------------------
async function guardarCategoria(evento, id) {
  evento.preventDefault(); // evita que la pagina se recargue

  const datos = {
    nombre:      document.getElementById('cat-nombre').value,
    descripcion: document.getElementById('cat-descripcion').value || null
  };

  try {
    if (id) {
      await modificarDatos(`/categorias/${id}`, datos);
      mostrarToast('Categoria actualizada');
    } else {
      await enviarDatos('/categorias', datos);
      mostrarToast('Categoria creada');
    }
    cerrarModal();
    cargarCategorias(); // refresca la tabla
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ----------------------------------------------------------
// ELIMINAR
// ----------------------------------------------------------
async function eliminarCategoria(id) {
  if (!confirm('¿Seguro que quieres eliminar esta categoria?')) return;

  try {
    await borrarDatos(`/categorias/${id}`);
    mostrarToast('Categoria eliminada');
    cargarCategorias();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}
