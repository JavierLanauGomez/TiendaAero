// ============================================================
// caja.js — Punto de venta rapido con acumulado de ventas
// ============================================================

var _cajaProductos  = [];
var _cajaClientes   = [];
var _cajaLineas     = [];
var _cajaTotalAcum  = 0;
var _cajaNumVentas  = 0;

// ----------------------------------------------------------
// CARGAR SECCION
// ----------------------------------------------------------
async function cargarCaja() {
  try {
    const [respProd, respCli] = await Promise.all([
      obtenerDatos('/productos'),
      obtenerDatos('/clientes')
    ]);
    _cajaProductos = respProd.productos;
    _cajaClientes  = respCli;
    _cajaRenderUI();
  } catch (e) {
    document.getElementById('contenido-caja').innerHTML =
      `<div class="mensaje-estado error">Error cargando caja: ${e.message}</div>`;
  }
}

// ----------------------------------------------------------
// RENDER PRINCIPAL
// ----------------------------------------------------------
function _cajaRenderUI() {
  const opsCli = _cajaClientes.map(c =>
    `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`
  ).join('');

  const opsProd = _cajaProductos.map(p =>
    `<option value="${p.id}" data-precio="${p.precio}" data-stock="${p.stock}">
      ${escapeHtml(p.nombre)} — ${Number(p.precio).toFixed(2)} € (stock: ${p.stock})
    </option>`
  ).join('');

  document.getElementById('contenido-caja').innerHTML = `
    <div class="caja-grid">

      <div class="card caja-panel">
        <h3 class="caja-panel-titulo">Añadir producto</h3>
        <div class="campo">
          <label>Cliente *</label>
          <select id="caja-cliente">
            <option value="">Selecciona cliente...</option>
            ${opsCli}
          </select>
        </div>
        <div class="campo">
          <label>Producto</label>
          <select id="caja-producto" onchange="_cajaPrecioHint()">
            <option value="">Selecciona producto...</option>
            ${opsProd}
          </select>
          <span id="caja-hint" class="caja-hint"></span>
        </div>
        <div class="campo">
          <label>Cantidad</label>
          <input type="number" id="caja-cant" value="1" min="1" style="width:90px">
        </div>
        <button class="btn btn-primario" onclick="_cajaAgregar()">+ Añadir al ticket</button>
      </div>

      <div class="card caja-panel">
        <h3 class="caja-panel-titulo">Ticket actual</h3>
        <div id="caja-ticket-lineas"><p class="caja-vacio">Sin productos</p></div>
        <div class="caja-total-row">
          <span>TOTAL</span>
          <span id="caja-total-val">0.00 €</span>
        </div>
        <div class="form-botones" style="margin-top:12px">
          <button class="btn btn-secundario" onclick="_cajaLimpiar()">Limpiar</button>
          <button class="btn btn-primario caja-btn-cobrar" onclick="_cajaCobrar()">Cobrar →</button>
        </div>
      </div>

      <div class="card caja-panel caja-acumulado-panel">
        <h3 class="caja-panel-titulo">Ventas del día</h3>
        <div class="caja-stat-big" id="caja-acum-total">0.00 €</div>
        <div class="caja-stat-sub" id="caja-acum-ventas">0 ventas</div>
      </div>

    </div>
  `;
  _cajaSyncAcumulado();
}

// ----------------------------------------------------------
// HINT DE PRECIO
// ----------------------------------------------------------
function _cajaPrecioHint() {
  const sel = document.getElementById('caja-producto');
  const opt = sel.options[sel.selectedIndex];
  const hint = document.getElementById('caja-hint');
  if (opt && opt.dataset.precio) {
    hint.textContent = `Precio: ${Number(opt.dataset.precio).toFixed(2)} € · Stock disponible: ${opt.dataset.stock}`;
  } else {
    hint.textContent = '';
  }
}

// ----------------------------------------------------------
// AGREGAR LINEA AL TICKET
// ----------------------------------------------------------
function _cajaAgregar() {
  const sel  = document.getElementById('caja-producto');
  const idP  = parseInt(sel.value);
  const cant = parseInt(document.getElementById('caja-cant').value) || 1;

  if (!idP) { mostrarToast('Selecciona un producto', 'error'); return; }

  const prod = _cajaProductos.find(p => p.id === idP);
  if (!prod) return;

  if (cant > prod.stock) {
    mostrarToast(`Stock insuficiente (disponible: ${prod.stock})`, 'error');
    return;
  }

  const existente = _cajaLineas.find(l => l.producto_id === idP);
  if (existente) {
    existente.cantidad += cant;
  } else {
    _cajaLineas.push({
      producto_id: idP,
      nombre: prod.nombre,
      precio: prod.precio,
      cantidad: cant
    });
  }
  _cajaRenderTicket();
}

// ----------------------------------------------------------
// RENDER TICKET
// ----------------------------------------------------------
function _cajaRenderTicket() {
  const cont = document.getElementById('caja-ticket-lineas');
  if (_cajaLineas.length === 0) {
    cont.innerHTML = '<p class="caja-vacio">Sin productos</p>';
    document.getElementById('caja-total-val').textContent = '0.00 €';
    return;
  }

  let total = 0;
  cont.innerHTML = `
    <table class="tabla">
      <thead>
        <tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Sub</th><th></th></tr>
      </thead>
      <tbody>
        ${_cajaLineas.map(l => {
          const sub = l.precio * l.cantidad;
          total += sub;
          return `<tr>
            <td>${escapeHtml(l.nombre)}</td>
            <td>${l.cantidad}</td>
            <td>${Number(l.precio).toFixed(2)} €</td>
            <td>${sub.toFixed(2)} €</td>
            <td><button class="btn-quitar-linea" onclick="_cajaQuitarLinea(${l.producto_id})">×</button></td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('caja-total-val').textContent = `${total.toFixed(2)} €`;
}

function _cajaQuitarLinea(idP) {
  _cajaLineas = _cajaLineas.filter(l => l.producto_id !== idP);
  _cajaRenderTicket();
}

function _cajaLimpiar() {
  _cajaLineas = [];
  _cajaRenderTicket();
}

// ----------------------------------------------------------
// COBRAR: crea el pedido y actualiza el acumulado
// ----------------------------------------------------------
async function _cajaCobrar() {
  if (_cajaLineas.length === 0) {
    mostrarToast('El ticket está vacío', 'error');
    return;
  }
  const clienteId = parseInt(document.getElementById('caja-cliente').value);
  if (!clienteId) {
    mostrarToast('Selecciona un cliente', 'error');
    return;
  }

  const lineas     = _cajaLineas.map(l => ({ producto_id: l.producto_id, cantidad: l.cantidad }));
  const totalVenta = _cajaLineas.reduce((s, l) => s + l.precio * l.cantidad, 0);

  try {
    await enviarDatos('/pedidos', { cliente_id: clienteId, lineas });

    _cajaTotalAcum  += totalVenta;
    _cajaNumVentas  += 1;
    _cajaLineas      = [];

    // Refrescar stock en cache
    const resp = await obtenerDatos('/productos');
    _cajaProductos = resp.productos;

    mostrarToast(`Venta cobrada — ${totalVenta.toFixed(2)} €`);
    _cajaRenderUI();
  } catch (e) {
    mostrarToast(e.message, 'error');
  }
}

// ----------------------------------------------------------
// SINCRONIZAR CONTADOR ACUMULADO (persiste entre re-renders)
// ----------------------------------------------------------
function _cajaSyncAcumulado() {
  const elT = document.getElementById('caja-acum-total');
  const elV = document.getElementById('caja-acum-ventas');
  if (elT) elT.textContent = `${_cajaTotalAcum.toFixed(2)} €`;
  if (elV) elV.textContent = `${_cajaNumVentas} venta${_cajaNumVentas !== 1 ? 's' : ''}`;
}
