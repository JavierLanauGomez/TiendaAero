// ============================================================
// dashboard.js — KPIs, alertas de stock y grafica de ventas
// ============================================================

// Instancia de Chart.js activa. Se destruye antes de volver a crear.
var _graficaVentas = null;

// ----------------------------------------------------------
// CARGAR DATOS
// ----------------------------------------------------------
async function cargarDashboard() {
  document.getElementById('dashboard-contenido').innerHTML =
    '<div class="mensaje-estado">Cargando...</div>';
  try {
    const datos = await obtenerDatos('/dashboard');
    renderizarDashboard(datos);
    actualizarBadgeStock(datos.stock_bajo.length);
  } catch (error) {
    document.getElementById('dashboard-contenido').innerHTML =
      `<div class="mensaje-estado error">Error: ${error.message}</div>`;
  }
}

// ----------------------------------------------------------
// RENDERIZAR TODO EL DASHBOARD
// ----------------------------------------------------------
function renderizarDashboard(datos) {
  const numStockBajo = datos.stock_bajo.length;

  // Banner de alerta de stock
  const alertaBanner = numStockBajo > 0 ? `
    <div class="alerta-stock">
      <strong>Atencion:</strong> ${numStockBajo} producto${numStockBajo > 1 ? 's' : ''}
      con stock bajo o agotado.
      <a href="#productos" onclick="navegarA('#productos'); return false;">Ver productos</a>
    </div>
  ` : '';

  // Filas de top productos
  const filasTop = datos.top_productos.length > 0
    ? datos.top_productos.map((p, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${p.nombre}</td>
          <td>${p.unidades_vendidas}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" class="celda-vacia">Sin datos todavia</td></tr>';

  // Filas de stock bajo
  const filasStock = numStockBajo > 0
    ? datos.stock_bajo.map(p => `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.marca || '—'}</td>
          <td><span class="badge badge-stock-bajo">${p.stock}</span></td>
          <td>${p.stock_minimo}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4" class="celda-vacia" style="color:var(--color-exito)">Todos los productos tienen stock suficiente</td></tr>';

  document.getElementById('dashboard-contenido').innerHTML = `
    ${alertaBanner}

    <div class="dashboard-kpis">
      <div class="kpi-card">
        <div class="kpi-valor">${Number(datos.total_ventas).toFixed(2)} €</div>
        <div class="kpi-etiqueta">Ventas totales</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-valor">${datos.total_pedidos}</div>
        <div class="kpi-etiqueta">Pedidos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-valor">${datos.total_clientes}</div>
        <div class="kpi-etiqueta">Clientes</div>
      </div>
      <div class="kpi-card ${numStockBajo > 0 ? 'kpi-card-alerta' : ''}">
        <div class="kpi-valor">${numStockBajo}</div>
        <div class="kpi-etiqueta">Stock bajo</div>
      </div>
    </div>

    <div class="grafica-contenedor">
      <h2 class="grafica-titulo">Ventas ultimos 6 meses</h2>
      <canvas id="grafica-ventas" height="80"></canvas>
    </div>

    <div class="dashboard-grid">
      <div>
        <h2 class="grafica-titulo">Top 5 productos mas vendidos</h2>
        <table class="tabla">
          <thead>
            <tr><th>#</th><th>Producto</th><th>Unidades</th></tr>
          </thead>
          <tbody>${filasTop}</tbody>
        </table>
      </div>
      <div>
        <h2 class="grafica-titulo">Productos con stock bajo</h2>
        <table class="tabla">
          <thead>
            <tr><th>Producto</th><th>Marca</th><th>Stock</th><th>Minimo</th></tr>
          </thead>
          <tbody>${filasStock}</tbody>
        </table>
      </div>
    </div>
  `;

  _dibujarGrafica(datos.ventas_por_mes);
}

// ----------------------------------------------------------
// GRAFICA DE VENTAS (Chart.js)
// ----------------------------------------------------------
function _dibujarGrafica(ventasPorMes) {
  if (_graficaVentas) {
    _graficaVentas.destroy();
    _graficaVentas = null;
  }

  const etiquetas = ventasPorMes.map(v => v.mes);
  const valores   = ventasPorMes.map(v => v.total_ventas);

  const ctx = document.getElementById('grafica-ventas').getContext('2d');
  _graficaVentas = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Ventas (€)',
        data: valores,
        backgroundColor: 'rgba(37, 99, 235, 0.75)',
        borderColor:     'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => value.toFixed(0) + ' €' }
        }
      }
    }
  });
}

// ----------------------------------------------------------
// BADGE DE STOCK BAJO EN EL NAV
// Llamada desde cargarDashboard() y desde cargarProductos()
// ----------------------------------------------------------
function actualizarBadgeStock(cantidad) {
  const badge = document.getElementById('badge-stock');
  if (!badge) return;
  badge.textContent = cantidad;
  if (cantidad > 0) {
    badge.classList.remove('oculta');
  } else {
    badge.classList.add('oculta');
  }
}
