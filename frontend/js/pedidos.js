// ============================================================
// pedidos.js — Pedidos: listar, crear, ver detalle, cambiar estado
// ============================================================

var _pedidos = [];
// Contador para dar IDs unicos a las lineas del formulario
var _contadorLineas = 0;

// ----------------------------------------------------------
// CARGAR Y MOSTRAR TABLA
// ----------------------------------------------------------
async function cargarPedidos() {
  mostrarMensaje('tabla-pedidos', 'Cargando...');
  try {
    // Aseguramos que los clientes esten cargados para mostrar el nombre
    if (_clientes.length === 0) {
      _clientes = await obtenerDatos('/clientes');
    }

    _pedidos = await obtenerDatos('/pedidos');

    if (_pedidos.length === 0) {
      mostrarMensaje('tabla-pedidos', 'No hay pedidos todavia.');
      return;
    }

    document.getElementById('tabla-pedidos').innerHTML = `
      <table class="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${_pedidos.map(pedido => `
            <tr>
              <td>${pedido.id}</td>
              <td>${buscarNombreCliente(pedido.cliente_id)}</td>
              <td>${pedido.fecha}</td>
              <td>${Number(pedido.total).toFixed(2)} €</td>
              <td><span class="badge badge-${pedido.estado}">${pedido.estado}</span></td>
              <td class="acciones">
                <button class="btn btn-secundario btn-sm"
                        onclick="verDetallePedido(${pedido.id})">Ver</button>
                <button class="btn btn-secundario btn-sm"
                        onclick="editarPedido(${pedido.id})">Editar lineas</button>
                <select class="select-estado"
                        onchange="cambiarEstado(${pedido.id}, this.value)">
                  <option value="pendiente"  ${pedido.estado === 'pendiente'  ? 'selected' : ''}>Pendiente</option>
                  <option value="enviado"    ${pedido.estado === 'enviado'    ? 'selected' : ''}>Enviado</option>
                  <option value="entregado"  ${pedido.estado === 'entregado'  ? 'selected' : ''}>Entregado</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    mostrarMensaje('tabla-pedidos', 'Error: ' + error.message, true);
  }
}

// Busca el nombre del cliente por id en la cache de clientes
function buscarNombreCliente(idCliente) {
  const cliente = _clientes.find(c => c.id === idCliente);
  return cliente ? cliente.nombre : `Cliente #${idCliente}`;
}

// Busca el nombre del producto por id en la cache de productos
function buscarNombreProducto(idProducto) {
  const producto = _productos.find(p => p.id === idProducto);
  return producto ? producto.nombre : `Producto #${idProducto}`;
}

// ----------------------------------------------------------
// VER DETALLE DE UN PEDIDO
// ----------------------------------------------------------
async function verDetallePedido(id) {
  try {
    const pedido = await obtenerDatos(`/pedidos/${id}`);

    abrirModal(`Pedido #${id}`, `
      <p><strong>Cliente:</strong> ${buscarNombreCliente(pedido.cliente_id)}</p>
      <p><strong>Fecha:</strong> ${pedido.fecha}</p>
      <p><strong>Estado:</strong> <span class="badge badge-${pedido.estado}">${pedido.estado}</span></p>
      <br>
      <table class="tabla">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${pedido.lineas.map(linea => `
            <tr>
              <td>${buscarNombreProducto(linea.producto_id)}</td>
              <td>${linea.cantidad}</td>
              <td>${Number(linea.precio_unitario).toFixed(2)} €</td>
              <td>${(linea.cantidad * linea.precio_unitario).toFixed(2)} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="total-pedido">Total: ${Number(pedido.total).toFixed(2)} €</div>
      <div class="form-botones">
        <button class="btn btn-secundario" onclick="cerrarModal()">Cerrar</button>
      </div>
    `);
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ----------------------------------------------------------
// CAMBIAR ESTADO (desde el select de la tabla)
// ----------------------------------------------------------
async function cambiarEstado(id, nuevoEstado) {
  try {
    await modificarDatos(`/pedidos/${id}/estado`, { estado: nuevoEstado });
    mostrarToast(`Estado cambiado a "${nuevoEstado}"`);
    cargarPedidos();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ----------------------------------------------------------
// FORMULARIO NUEVO PEDIDO
// ----------------------------------------------------------
async function abrirFormPedido() {
  // Cargar clientes y productos si no estan en cache todavia
  if (_clientes.length === 0) {
    try { _clientes = await obtenerDatos('/clientes'); } catch (_) {}
  }
  if (_productos.length === 0) {
    try { _productos = await obtenerDatos('/productos'); } catch (_) {}
  }

  _contadorLineas = 0;

  const opcionesClientes = _clientes.map(cliente =>
    `<option value="${cliente.id}">${cliente.nombre}</option>`
  ).join('');

  abrirModal('Nuevo pedido', `
    <form onsubmit="guardarPedido(event)">
      <div class="campo">
        <label>Cliente *</label>
        <select id="ped-cliente" required>
          <option value="">Selecciona un cliente...</option>
          ${opcionesClientes}
        </select>
      </div>

      <div class="campo">
        <label>Lineas del pedido</label>
        <div class="lineas-cabecera">
          <span>Producto</span><span>Cantidad</span><span></span>
        </div>
        <div id="contenedor-lineas"></div>
        <button type="button" class="btn btn-secundario btn-sm"
                onclick="agregarLineaPedido()" style="margin-top:8px">
          + Agregar producto
        </button>
      </div>

      <div class="total-pedido">
        Total estimado: <span id="total-estimado">0.00</span> €
      </div>

      <div class="form-botones">
        <button type="button" class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
        <button type="submit" class="btn btn-primario">Crear pedido</button>
      </div>
    </form>
  `);

  // Agregar la primera linea automaticamente para no arrancar con el formulario vacio
  agregarLineaPedido();
}

// Agrega una nueva fila de producto + cantidad al formulario
function agregarLineaPedido() {
  _contadorLineas++;
  const numero = _contadorLineas;

  const opcionesProductos = _productos.map(producto =>
    `<option value="${producto.id}">${producto.nombre} — ${Number(producto.precio).toFixed(2)} €</option>`
  ).join('');

  const nuevaLinea = document.createElement('div');
  nuevaLinea.className = 'linea-pedido';
  nuevaLinea.id = `linea-${numero}`;
  nuevaLinea.innerHTML = `
    <select id="linea-producto-${numero}" onchange="recalcularTotal()">
      <option value="">Selecciona...</option>
      ${opcionesProductos}
    </select>
    <input type="number" id="linea-cantidad-${numero}" value="1" min="1"
           oninput="recalcularTotal()">
    <button type="button" class="btn-quitar-linea"
            onclick="quitarLinea(${numero})">×</button>
  `;
  document.getElementById('contenedor-lineas').appendChild(nuevaLinea);
}

// Elimina una linea del formulario
function quitarLinea(numero) {
  const linea = document.getElementById(`linea-${numero}`);
  if (linea) linea.remove();
  recalcularTotal();
}

// Recalcula el total sumando precio * cantidad de cada linea
function recalcularTotal() {
  let totalAcumulado = 0;

  document.querySelectorAll('.linea-pedido').forEach(linea => {
    const numero     = linea.id.replace('linea-', '');
    const idProducto = parseInt(document.getElementById(`linea-producto-${numero}`)?.value);
    const cantidad   = parseInt(document.getElementById(`linea-cantidad-${numero}`)?.value) || 0;
    const producto   = _productos.find(p => p.id === idProducto);
    if (producto) totalAcumulado += producto.precio * cantidad;
  });

  const elementoTotal = document.getElementById('total-estimado');
  if (elementoTotal) elementoTotal.textContent = totalAcumulado.toFixed(2);
}

// ----------------------------------------------------------
// GUARDAR PEDIDO
// ----------------------------------------------------------
async function guardarPedido(evento) {
  evento.preventDefault();

  const idCliente = parseInt(document.getElementById('ped-cliente').value);

  // Recoger todas las lineas del formulario
  const lineas = [];
  document.querySelectorAll('.linea-pedido').forEach(linea => {
    const numero     = linea.id.replace('linea-', '');
    const idProducto = parseInt(document.getElementById(`linea-producto-${numero}`)?.value);
    const cantidad   = parseInt(document.getElementById(`linea-cantidad-${numero}`)?.value);
    if (idProducto && cantidad > 0) {
      lineas.push({ producto_id: idProducto, cantidad });
    }
  });

  if (lineas.length === 0) {
    mostrarToast('Agrega al menos un producto', 'error');
    return;
  }

  try {
    const resultado = await enviarDatos('/pedidos', { cliente_id: idCliente, lineas });
    mostrarToast(`Pedido creado — Total: ${Number(resultado.total).toFixed(2)} €`);
    cerrarModal();
    // Recargar productos para ver el stock actualizado
    _productos = await obtenerDatos('/productos');
    actualizarBadgeStock(_productos.filter(p => p.stock <= p.stock_minimo).length);
    cargarPedidos();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ----------------------------------------------------------
// EDITAR LINEAS DE UN PEDIDO EXISTENTE
// ----------------------------------------------------------
async function editarPedido(id) {
  try {
    const pedido = await obtenerDatos(`/pedidos/${id}`);

    if (_clientes.length === 0) {
      _clientes = await obtenerDatos('/clientes');
    }
    if (_productos.length === 0) {
      _productos = await obtenerDatos('/productos');
    }

    _contadorLineas = 0;

    const opcionesClientes = _clientes.map(c =>
      `<option value="${c.id}" ${c.id === pedido.cliente_id ? 'selected' : ''}>${c.nombre}</option>`
    ).join('');

    abrirModal(`Editar pedido #${id}`, `
      <form onsubmit="guardarEdicionPedido(event, ${id})">
        <div class="campo">
          <label>Cliente</label>
          <select id="ped-cliente" disabled>
            ${opcionesClientes}
          </select>
        </div>

        <div class="campo">
          <label>Lineas del pedido</label>
          <div class="lineas-cabecera">
            <span>Producto</span><span>Cantidad</span><span></span>
          </div>
          <div id="contenedor-lineas"></div>
          <button type="button" class="btn btn-secundario btn-sm"
                  onclick="agregarLineaPedido()" style="margin-top:8px">
            + Agregar producto
          </button>
        </div>

        <div class="total-pedido">
          Total estimado: <span id="total-estimado">0.00</span> €
        </div>

        <div class="form-botones">
          <button type="button" class="btn btn-secundario" onclick="cerrarModal()">Cancelar</button>
          <button type="submit" class="btn btn-primario">Guardar cambios</button>
        </div>
      </form>
    `);

    // Pre-rellenar con las lineas actuales del pedido
    for (const linea of pedido.lineas) {
      agregarLineaPedido();
      const num = _contadorLineas;
      document.getElementById(`linea-producto-${num}`).value = linea.producto_id;
      document.getElementById(`linea-cantidad-${num}`).value = linea.cantidad;
    }
    recalcularTotal();

  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

async function guardarEdicionPedido(evento, id) {
  evento.preventDefault();

  const lineas = [];
  document.querySelectorAll('.linea-pedido').forEach(linea => {
    const numero     = linea.id.replace('linea-', '');
    const idProducto = parseInt(document.getElementById(`linea-producto-${numero}`)?.value);
    const cantidad   = parseInt(document.getElementById(`linea-cantidad-${numero}`)?.value);
    if (idProducto && cantidad > 0) {
      lineas.push({ producto_id: idProducto, cantidad });
    }
  });

  if (lineas.length === 0) {
    mostrarToast('Agrega al menos un producto', 'error');
    return;
  }

  try {
    const resultado = await modificarDatos(`/pedidos/${id}/lineas`, { lineas });
    mostrarToast(`Pedido actualizado — Total: ${Number(resultado.total).toFixed(2)} €`);
    cerrarModal();
    _productos = await obtenerDatos('/productos');
    actualizarBadgeStock(_productos.filter(p => p.stock <= p.stock_minimo).length);
    cargarPedidos();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}
