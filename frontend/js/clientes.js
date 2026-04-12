// ============================================================
// clientes.js — CRUD de clientes
// ============================================================

var _clientes = [];

// ----------------------------------------------------------
// CARGAR Y MOSTRAR TABLA
// ----------------------------------------------------------
async function cargarClientes() {
  mostrarMensaje('tabla-clientes', 'Cargando...');
  try {
    _clientes = await obtenerDatos('/clientes');

    if (_clientes.length === 0) {
      mostrarMensaje('tabla-clientes', 'No hay clientes todavia.');
      return;
    }

    document.getElementById('tabla-clientes').innerHTML = `
      <table class="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Telefono</th>
            <th>Direccion</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${_clientes.map(cliente => `
            <tr>
              <td>${cliente.id}</td>
              <td>${cliente.nombre}</td>
              <td>${cliente.email}</td>
              <td>${cliente.telefono || '—'}</td>
              <td>${cliente.direccion || '—'}</td>
              <td class="acciones">
                <button class="btn btn-secundario btn-sm"
                        onclick="abrirFormCliente(${cliente.id})">Editar</button>
                <button class="btn btn-peligro btn-sm"
                        onclick="eliminarCliente(${cliente.id})">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    mostrarMensaje('tabla-clientes', 'Error: ' + error.message, true);
  }
}

// ----------------------------------------------------------
// ABRIR FORMULARIO
// ----------------------------------------------------------
function abrirFormCliente(id) {
  const cliente = id ? _clientes.find(c => c.id === id) : null;
  const titulo = cliente ? 'Editar cliente' : 'Nuevo cliente';

  abrirModal(titulo, `
    <form onsubmit="guardarCliente(event, ${id || ''})">
      <div class="campo">
        <label>Nombre *</label>
        <input type="text" id="cli-nombre" required
               value="${cliente ? cliente.nombre : ''}">
      </div>
      <div class="campo">
        <label>Email *</label>
        <input type="email" id="cli-email" required
               value="${cliente ? cliente.email : ''}">
      </div>
      <div class="campo">
        <label>Telefono</label>
        <input type="text" id="cli-telefono"
               value="${cliente && cliente.telefono ? cliente.telefono : ''}">
      </div>
      <div class="campo">
        <label>Direccion</label>
        <input type="text" id="cli-direccion"
               value="${cliente && cliente.direccion ? cliente.direccion : ''}">
      </div>
      <div class="form-botones">
        <button type="button" class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Guardar</button>
      </div>
    </form>
  `);
}

// ----------------------------------------------------------
// GUARDAR
// ----------------------------------------------------------
async function guardarCliente(evento, id) {
  evento.preventDefault();

  const datos = {
    nombre:    document.getElementById('cli-nombre').value,
    email:     document.getElementById('cli-email').value,
    telefono:  document.getElementById('cli-telefono').value  || null,
    direccion: document.getElementById('cli-direccion').value || null
  };

  try {
    if (id) {
      await modificarDatos(`/clientes/${id}`, datos);
      mostrarToast('Cliente actualizado');
    } else {
      await enviarDatos('/clientes', datos);
      mostrarToast('Cliente creado');
    }
    cerrarModal();
    cargarClientes();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ----------------------------------------------------------
// ELIMINAR
// ----------------------------------------------------------
async function eliminarCliente(id) {
  if (!confirm('¿Seguro que quieres eliminar este cliente?')) return;

  try {
    await borrarDatos(`/clientes/${id}`);
    mostrarToast('Cliente eliminado');
    cargarClientes();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}
