// ============================================================
// dashboard.js — Panel de control principal de TiendaAero
//
// Secciones renderizadas:
//   1. Caja diaria      — card hero con ingresos del día
//   2. KPIs de ventas   — hoy / semana / mes con comparativas
//   3. Ticket medio      — importe promedio por transacción
//   4. Pedidos del día   — contador con comparativa vs. ayer
//   5. Top 5 productos   — ranking con barras de progreso
//   6. Gráfica 6 meses   — histograma de ventas (Chart.js)
//   7. Stock bajo        — tabla de alertas
// ============================================================

// Instancia activa de Chart.js. Se destruye antes de recrear
// para evitar que se acumulen capas invisibles en el canvas.
var _graficaVentas = null;

// ----------------------------------------------------------
// CARGAR DATOS DEL SERVIDOR
// Llama al endpoint /dashboard y dispara el renderizado.
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
      `<div class="mensaje-estado error">Error al cargar el dashboard: ${error.message}</div>`;
  }
}

// ----------------------------------------------------------
// CÁLCULO DE TENDENCIA
// Compara dos valores y devuelve dirección y porcentaje.
// Retorna: { pct: string, direccion: 'up'|'down'|'flat' }
// ----------------------------------------------------------
function _calcularTendencia(actual, anterior) {
  if (anterior === 0) {
    return actual > 0
      ? { pct: '100.0', direccion: 'up' }
      : { pct: '0.0', direccion: 'flat' };
  }
  const diff = ((actual - anterior) / anterior) * 100;
  return {
    pct: Math.abs(diff).toFixed(1),
    direccion: diff > 0.5 ? 'up' : diff < -0.5 ? 'down' : 'flat',
  };
}

// ----------------------------------------------------------
// HTML DE INDICADOR DE TENDENCIA
// Genera el span con flecha y color según la comparativa.
// textoComp: texto que sigue al porcentaje ("vs. ayer", etc.)
// ----------------------------------------------------------
function _tendenciaHTML(actual, anterior, textoComp) {
  const { pct, direccion } = _calcularTendencia(actual, anterior);
  const cfg = {
    up:   { flecha: '↑', clase: 'tendencia-sube',  etiqueta: `+${pct}%` },
    down: { flecha: '↓', clase: 'tendencia-baja',  etiqueta: `-${pct}%` },
    flat: { flecha: '→', clase: 'tendencia-igual', etiqueta: `0%` },
  }[direccion];
  return `<span class="kpi-tendencia ${cfg.clase}">${cfg.flecha} ${cfg.etiqueta} ${textoComp}</span>`;
}

// ----------------------------------------------------------
// RENDERIZAR TODO EL DASHBOARD
// Construye el HTML completo y lo inyecta en el contenedor.
// ----------------------------------------------------------
function renderizarDashboard(datos) {
  const numStockBajo = datos.stock_bajo.length;

  // ── Banner de alerta de stock ────────────────────────────────────────────
  // Se muestra en rojo en la parte superior cuando hay productos críticos.
  const alertaBanner = numStockBajo > 0 ? `
    <div class="alerta-stock">
      <strong>Atención:</strong> ${numStockBajo} producto${numStockBajo > 1 ? 's' : ''}
      con stock bajo o agotado.
      <a href="#productos" onclick="navegarA('#productos'); return false;">Ver productos</a>
    </div>
  ` : '';

  // ── 1. CAJA DIARIA ───────────────────────────────────────────────────────
  // La caja se considera abierta si hay al menos un pedido registrado hoy.
  // Como la BD almacena fecha sin hora, no podemos mostrar hora exacta de apertura.
  const cajaAbierta = datos.pedidos_hoy > 0;
  const cajaBadge = cajaAbierta
    ? `<span class="caja-badge caja-abierta">● Abierta</span>`
    : `<span class="caja-badge caja-cerrada">● Cerrada</span>`;

  // ── 2-4. TENDENCIAS para las 5 tarjetas de métricas ─────────────────────
  const tHoy      = _tendenciaHTML(datos.ventas_hoy,        datos.ventas_ayer,          'vs. ayer');
  const tSemana   = _tendenciaHTML(datos.ventas_semana,     datos.ventas_semana_anterior,'vs. sem. ant.');
  const tMes      = _tendenciaHTML(datos.ventas_mes_actual, datos.ventas_mes_anterior,   'vs. mes ant.');
  const tTicket   = _tendenciaHTML(datos.ticket_medio_hoy,  datos.ticket_medio_ayer,     'vs. ayer');
  const tPedidos  = _tendenciaHTML(datos.pedidos_hoy,       datos.pedidos_ayer,          'vs. ayer');

  // ── 5. TOP 5 PRODUCTOS ───────────────────────────────────────────────────
  // Barras de progreso relativas al producto con más unidades (= 100 %).
  const maxUnidades = datos.top_productos.length > 0
    ? datos.top_productos[0].unidades_vendidas : 1;
  const medallas = ['🥇', '🥈', '🥉', '4º', '5º'];

  const listaTop = datos.top_productos.length > 0
    ? datos.top_productos.map((p, i) => {
        const pct = Math.round((p.unidades_vendidas / maxUnidades) * 100);
        return `
          <div class="top-producto-item">
            <div class="top-producto-rank">${medallas[i]}</div>
            <div class="top-producto-info">
              <div class="top-producto-nombre">${p.nombre}</div>
              <div class="top-producto-barra">
                <div class="top-producto-barra-fill" style="width:${pct}%"></div>
              </div>
            </div>
            <div class="top-producto-stats">
              <div class="top-stat-principal">${p.unidades_vendidas} uds</div>
              <div class="top-stat-secundario">${Number(p.importe_generado).toFixed(2)} €</div>
            </div>
          </div>`;
      }).join('')
    : '<p class="celda-vacia">Sin datos de ventas todavía</p>';

  // ── 7. TABLA DE STOCK BAJO ───────────────────────────────────────────────
  const filasStock = numStockBajo > 0
    ? datos.stock_bajo.map(p => `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.marca || '—'}</td>
          <td><span class="badge badge-stock-bajo">${p.stock}</span></td>
          <td>${p.stock_minimo}</td>
        </tr>`).join('')
    : `<tr><td colspan="4" class="celda-vacia" style="color:var(--color-exito)">
         Todos los productos tienen stock suficiente
       </td></tr>`;

  // ── HTML COMPLETO DEL DASHBOARD ──────────────────────────────────────────
  document.getElementById('dashboard-contenido').innerHTML = `
    ${alertaBanner}

    <!-- ══ 1. CAJA DIARIA ════════════════════════════════════════════════
         Card hero prominente: ingresos del día y estado de caja.
         Fondo degradado oscuro para que destaque sobre las demás cards.
    ═══════════════════════════════════════════════════════════════════ -->
    <div class="kpi-hero">
      <div class="kpi-hero-izquierda">
        <div class="kpi-hero-titulo">
          <span class="kpi-hero-icono">💰</span>
          Caja del día — ${new Date().toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'long'})}
        </div>
        <div class="kpi-hero-valor">${Number(datos.ventas_hoy).toFixed(2)} €</div>
        <div class="kpi-hero-meta">${tHoy}</div>
      </div>
      <div class="kpi-hero-derecha">
        <div class="kpi-hero-estado-label">Estado de caja</div>
        ${cajaBadge}
        <div class="kpi-hero-subtexto">
          ${datos.pedidos_hoy} pedido${datos.pedidos_hoy !== 1 ? 's' : ''} registrado${datos.pedidos_hoy !== 1 ? 's' : ''} hoy
        </div>
      </div>
    </div>

    <!-- ══ 2-4. KPIs DE VENTAS ════════════════════════════════════════════
         Cinco tarjetas en grid responsivo: hoy, semana, mes,
         ticket medio y pedidos del día. Cada una incluye comparativa
         con el período anterior mediante flecha e indicador de color.
    ═══════════════════════════════════════════════════════════════════ -->
    <div class="kpi-metricas">

      <!-- Ventas de hoy vs. ayer -->
      <div class="kpi-metrica" style="border-top-color:#3b82f6;">
        <div class="kpi-metrica-icono" style="background:#eff6ff;color:#2563eb;">📅</div>
        <div class="kpi-metrica-valor">${Number(datos.ventas_hoy).toFixed(2)} €</div>
        <div class="kpi-metrica-titulo">Ventas hoy</div>
        ${tHoy}
      </div>

      <!-- Ventas de la semana vs. semana anterior -->
      <div class="kpi-metrica" style="border-top-color:#8b5cf6;">
        <div class="kpi-metrica-icono" style="background:#f5f3ff;color:#7c3aed;">📆</div>
        <div class="kpi-metrica-valor">${Number(datos.ventas_semana).toFixed(2)} €</div>
        <div class="kpi-metrica-titulo">Ventas esta semana</div>
        ${tSemana}
      </div>

      <!-- Ventas del mes vs. mes anterior -->
      <div class="kpi-metrica" style="border-top-color:#f59e0b;">
        <div class="kpi-metrica-icono" style="background:#fffbeb;color:#d97706;">🗓️</div>
        <div class="kpi-metrica-valor">${Number(datos.ventas_mes_actual).toFixed(2)} €</div>
        <div class="kpi-metrica-titulo">Ventas este mes</div>
        ${tMes}
      </div>

      <!-- Ticket medio del día: importe promedio por pedido -->
      <div class="kpi-metrica" style="border-top-color:#10b981;">
        <div class="kpi-metrica-icono" style="background:#ecfdf5;color:#059669;">🧾</div>
        <div class="kpi-metrica-valor">${Number(datos.ticket_medio_hoy).toFixed(2)} €</div>
        <div class="kpi-metrica-titulo">Ticket medio hoy</div>
        ${tTicket}
        <div class="kpi-metrica-sub">Basado en ${datos.pedidos_hoy} transacc. hoy</div>
      </div>

      <!-- Pedidos del día: número de transacciones registradas -->
      <div class="kpi-metrica" style="border-top-color:#ef4444;">
        <div class="kpi-metrica-icono" style="background:#fef2f2;color:#dc2626;">🛒</div>
        <div class="kpi-metrica-valor">${datos.pedidos_hoy}</div>
        <div class="kpi-metrica-titulo">Pedidos hoy</div>
        ${tPedidos}
        <div class="kpi-metrica-sub">Ayer: ${datos.pedidos_ayer} pedido${datos.pedidos_ayer !== 1 ? 's' : ''}</div>
      </div>

    </div>

    <!-- ══ 5-6. TOP PRODUCTOS + GRÁFICA ══════════════════════════════════
         Grid de dos columnas: ranking de productos a la izquierda
         y evolución mensual de ventas (Chart.js) a la derecha.
    ═══════════════════════════════════════════════════════════════════ -->
    <div class="dashboard-grid" style="margin-bottom:20px;">

      <!-- Top 5 productos: nombre, barra relativa, unidades e importe -->
      <div class="panel-card">
        <h2 class="panel-titulo"><span>🏆</span> Top 5 productos más vendidos</h2>
        <div class="top-productos-lista">${listaTop}</div>
      </div>

      <!-- Gráfica de evolución de ventas de los últimos 6 meses -->
      <div class="panel-card">
        <h2 class="panel-titulo"><span>📊</span> Ventas últimos 6 meses</h2>
        <canvas id="grafica-ventas" height="200"></canvas>
      </div>

    </div>

    <!-- ══ 7. STOCK BAJO ══════════════════════════════════════════════════
         Tabla de productos cuyo stock está en o por debajo del mínimo.
    ═══════════════════════════════════════════════════════════════════ -->
    <div class="panel-card">
      <h2 class="panel-titulo">
        <span>⚠️</span> Productos con stock bajo
        ${numStockBajo > 0 ? `<span class="panel-badge-alerta">${numStockBajo}</span>` : ''}
      </h2>
      <table class="tabla">
        <thead>
          <tr><th>Producto</th><th>Marca</th><th>Stock actual</th><th>Mínimo</th></tr>
        </thead>
        <tbody>${filasStock}</tbody>
      </table>
    </div>
  `;

  _dibujarGrafica(datos.ventas_por_mes);
}

// ----------------------------------------------------------
// GRÁFICA DE VENTAS MENSUALES (Chart.js)
// Destruye la instancia previa para evitar duplicados en el
// canvas cuando el usuario navega y vuelve al dashboard.
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
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: value => value.toFixed(0) + ' €' },
        },
      },
    },
  });
}

// ----------------------------------------------------------
// BADGE DE STOCK BAJO EN EL NAV
// Actualiza el contador rojo junto al enlace de Productos.
// Llamada desde cargarDashboard() y desde cargarProductos().
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
