// ============================================================
// clientes.js — CRUD de clientes + historial de pedidos
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
              <td>${escapeHtml(cliente.nombre)}</td>
              <td>${escapeHtml(cliente.email)}</td>
              <td>${escapeHtml(cliente.telefono) || '—'}</td>
              <td>${escapeHtml(cliente.direccion) || '—'}</td>
              <td class="acciones">
                <button class="btn btn-info btn-sm"
                        onclick="verHistorialCliente(${cliente.id})">Pedidos</button>
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
    inicializarBuscador('buscar-clientes', 'tabla-clientes');
  } catch (error) {
    mostrarMensaje('tabla-clientes', 'Error: ' + error.message, true);
  }
}

// ----------------------------------------------------------
// HISTORIAL DE PEDIDOS DE UN CLIENTE
// Llama a GET /clientes/{id}/pedidos (devuelve solo los pedidos
// de ese cliente ordenados del mas reciente al mas antiguo).
// No reutiliza _pedidos porque el usuario puede no haber
// visitado aun la seccion Pedidos.
// ----------------------------------------------------------
async function verHistorialCliente(id) {
  const cliente = _clientes.find(c => c.id === id);
  try {
    const pedidos = await obtenerDatos(`/clientes/${id}/pedidos`);

    const filas = pedidos.length === 0
      ? '<tr><td colspan="4" class="texto-centrado texto-suave">Este cliente no tiene pedidos todavia.</td></tr>'
      : pedidos.map(p => `
          <tr>
            <td>#${p.id}</td>
            <td>${formatearFecha(p.fecha)}</td>
            <td>${Number(p.total).toFixed(2)} €</td>
            <td><span class="badge badge-${p.estado}">${p.estado}</span></td>
          </tr>
        `).join('');

    abrirModal(`Pedidos de ${escapeHtml(cliente ? cliente.nombre : 'cliente')}`, `
      <table class="tabla">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="form-botones" style="margin-top:16px">
        <button class="btn btn-secundario" onclick="cerrarModal()">Cerrar</button>
      </div>
    `);
  } catch (error) {
    mostrarToast(error.message, 'error');
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
               value="${escapeHtml(cliente ? cliente.nombre : '')}">
      </div>
      <div class="campo">
        <label>Email *</label>
        <input type="email" id="cli-email" required
               value="${escapeHtml(cliente ? cliente.email : '')}">
      </div>
      <div class="campo">
        <label>Telefono</label>
        <input type="text" id="cli-telefono"
               value="${escapeHtml(cliente && cliente.telefono ? cliente.telefono : '')}">
      </div>
      <div class="campo">
        <label>Direccion</label>
        <input type="text" id="cli-direccion"
               value="${escapeHtml(cliente && cliente.direccion ? cliente.direccion : '')}">
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
  confirmar('¿Seguro que quieres eliminar este cliente?', async () => {
    try {
      await borrarDatos(`/clientes/${id}`);
      mostrarToast('Cliente eliminado');
      cargarClientes();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  });
}
