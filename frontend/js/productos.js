// ============================================================
// productos.js — CRUD de productos
// ============================================================

var _productos = [];

// ----------------------------------------------------------
// CARGAR Y MOSTRAR TABLA
// ----------------------------------------------------------
async function cargarProductos() {
  mostrarMensaje('tabla-productos', 'Cargando...');
  try {
    // El backend devuelve { productos: [...], total: N, pagina: 1, tamano: 100 }
    const respuesta = await obtenerDatos('/productos');
    _productos = respuesta.productos;

    if (_productos.length === 0) {
      mostrarMensaje('tabla-productos', 'No hay productos todavia.');
      return;
    }

    document.getElementById('tabla-productos').innerHTML = `
      <table class="tabla">
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${_productos.map(producto => {
            // Si el stock es igual o menor al minimo, mostramos badge rojo
            const etiquetaStock = producto.stock <= producto.stock_minimo
              ? `<span class="badge badge-stock-bajo">${producto.stock} (bajo)</span>`
              : `<span class="badge badge-stock-ok">${producto.stock}</span>`;

            // Miniatura de imagen o placeholder
            const miniatura = producto.imagen_url
              ? `<img src="${escapeHtml(producto.imagen_url)}" alt="" class="producto-thumb"
                      onerror="this.style.display='none'">`
              : `<span class="producto-thumb-vacio"></span>`;

            return `
              <tr${producto.stock <= producto.stock_minimo ? ' class="fila-stock-bajo"' : ''}>
                <td>${miniatura}</td>
                <td>${producto.id}</td>
                <td>${escapeHtml(producto.nombre)}</td>
                <td>${escapeHtml(producto.marca) || '—'}</td>
                <td>${Number(producto.precio).toFixed(2)} €</td>
                <td>${etiquetaStock}</td>
                <td class="acciones">
                  <button class="btn btn-secundario btn-sm"
                          onclick="abrirFormProducto(${producto.id})">Editar</button>
                  <button class="btn btn-peligro btn-sm"
                          onclick="eliminarProducto(${producto.id})">Eliminar</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
    actualizarBadgeStock(_productos.filter(p => p.stock <= p.stock_minimo).length);
    inicializarBuscador('buscar-productos', 'tabla-productos');
  } catch (error) {
    mostrarMensaje('tabla-productos', 'Error: ' + error.message, true);
  }
}

// ----------------------------------------------------------
// ABRIR FORMULARIO
// ----------------------------------------------------------
async function abrirFormProducto(id) {
  // Necesitamos las categorias para el desplegable.
  // Si ya estan en cache las usamos, si no las pedimos.
  if (_categorias.length === 0) {
    try { _categorias = await obtenerDatos('/categorias'); } catch (_) {}
  }

  const producto = id ? _productos.find(p => p.id === id) : null;
  const titulo = producto ? 'Editar producto' : 'Nuevo producto';

  const opcionesCategorias = _categorias.map(categoria =>
    `<option value="${categoria.id}"
             ${producto && producto.categoria_id === categoria.id ? 'selected' : ''}>
       ${categoria.nombre}
     </option>`
  ).join('');

  abrirModal(titulo, `
    <form onsubmit="guardarProducto(event, ${id || ''})">
      <div class="campos-grid">
        <div class="campo">
          <label>Nombre *</label>
          <input type="text" id="prod-nombre" required
                 value="${escapeHtml(producto ? producto.nombre : '')}">
        </div>
        <div class="campo">
          <label>Marca</label>
          <input type="text" id="prod-marca"
                 value="${escapeHtml(producto && producto.marca ? producto.marca : '')}">
        </div>
        <div class="campo">
          <label>Precio (€) *</label>
          <input type="number" id="prod-precio" required min="0" step="0.01"
                 value="${producto ? producto.precio : ''}">
        </div>
        <div class="campo">
          <label>Categoria *</label>
          <select id="prod-categoria" required>
            <option value="">Selecciona...</option>
            ${opcionesCategorias}
          </select>
        </div>
        <div class="campo">
          <label>Stock actual</label>
          <input type="number" id="prod-stock" min="0"
                 value="${producto ? producto.stock : 0}">
        </div>
        <div class="campo">
          <label>Stock minimo</label>
          <input type="number" id="prod-stock-minimo" min="0"
                 value="${producto ? producto.stock_minimo : 1}">
        </div>
      </div>
      <div class="campo">
        <label>Descripcion</label>
        <input type="text" id="prod-descripcion"
               value="${escapeHtml(producto && producto.descripcion ? producto.descripcion : '')}">
      </div>
      <div class="campo">
        <label>URL de imagen</label>
        <input type="text" id="prod-imagen"
               value="${escapeHtml(producto && producto.imagen_url ? producto.imagen_url : '')}">
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
async function guardarProducto(evento, id) {
  evento.preventDefault();

  const datos = {
    nombre:       document.getElementById('prod-nombre').value,
    marca:        document.getElementById('prod-marca').value       || null,
    precio:       parseFloat(document.getElementById('prod-precio').value),
    categoria_id: parseInt(document.getElementById('prod-categoria').value),
    stock:        parseInt(document.getElementById('prod-stock').value),
    stock_minimo: parseInt(document.getElementById('prod-stock-minimo').value),
    descripcion:  document.getElementById('prod-descripcion').value || null,
    imagen_url:   document.getElementById('prod-imagen').value      || null
  };

  try {
    if (id) {
      await modificarDatos(`/productos/${id}`, datos);
      mostrarToast('Producto actualizado');
    } else {
      await enviarDatos('/productos', datos);
      mostrarToast('Producto creado');
    }
    cerrarModal();
    cargarProductos();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ----------------------------------------------------------
// EXPORTAR CSV
// Genera un archivo CSV con los productos actualmente cargados
// e inicia la descarga directamente en el navegador.
// El BOM (U+FEFF) asegura que Excel abra el CSV con UTF-8 correcto.
// ----------------------------------------------------------
function exportarProductosCSV() {
  if (!_productos || _productos.length === 0) {
    mostrarToast('No hay productos para exportar', 'error');
    return;
  }

  const escaparCampo = v => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const cabeceras = ['ID', 'Nombre', 'Marca', 'Precio (€)', 'Stock', 'Stock Mínimo', 'Descripción'];
  const filas = _productos.map(p => [
    p.id,
    escaparCampo(p.nombre),
    escaparCampo(p.marca),
    Number(p.precio).toFixed(2),
    p.stock,
    p.stock_minimo,
    escaparCampo(p.descripcion),
  ].join(','));

  const csv = [cabeceras.join(','), ...filas].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
  mostrarToast('CSV exportado correctamente');
}

// ----------------------------------------------------------
// ELIMINAR (usa modal de confirmacion en lugar de confirm())
// ----------------------------------------------------------
async function eliminarProducto(id) {
  confirmar('¿Seguro que quieres eliminar este producto?', async () => {
    try {
      await borrarDatos(`/productos/${id}`);
      mostrarToast('Producto eliminado');
      cargarProductos();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  });
}
