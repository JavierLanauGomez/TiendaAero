// ============================================================
// socios.js — Gestión de socios: altas, bajas y estadísticas
// ============================================================

var _socios = [];

// ----------------------------------------------------------
// CARGAR ESTADÍSTICAS + TABLA
// ----------------------------------------------------------
async function cargarSocios() {
  mostrarMensaje('tabla-socios', 'Cargando...');
  try {
    const [estadisticas, lista] = await Promise.all([
      obtenerDatos('/socios/estadisticas'),
      obtenerDatos('/socios'),
    ]);
    _socios = lista;

    _renderizarStats(estadisticas);

    if (_socios.length === 0) {
      mostrarMensaje('tabla-socios', 'No hay socios todavia.');
      return;
    }

    document.getElementById('tabla-socios').innerHTML = `
      <table class="tabla">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Telefono</th>
            <th>Alta</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${_socios.map(s => `
            <tr>
              <td>${s.id}</td>
              <td>${escapeHtml(s.nombre)}</td>
              <td>${escapeHtml(s.email)}</td>
              <td>${escapeHtml(s.telefono) || '—'}</td>
              <td>${formatearFecha(s.fecha_alta)}</td>
              <td><span class="badge badge-socio-${s.estado}">${s.estado}</span></td>
              <td class="acciones">
                ${s.estado === 'activo'
                  ? `<button class="btn btn-secundario btn-sm" onclick="darDeBajaSocio(${s.id})">Dar de baja</button>`
                  : ''}
                <button class="btn btn-secundario btn-sm" onclick="abrirFormSocio(${s.id})">Editar</button>
                <button class="btn btn-peligro btn-sm" onclick="eliminarSocio(${s.id})">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    inicializarBuscador('buscar-socios', 'tabla-socios');
  } catch (error) {
    mostrarMensaje('tabla-socios', 'Error: ' + error.message, true);
  }
}

// ----------------------------------------------------------
// RENDERIZAR KPIs DE SOCIOS
// ----------------------------------------------------------
function _renderizarStats(stats) {
  document.getElementById('socios-stats').innerHTML = `
    <div class="socios-kpis">
      <div class="kpi-metrica" style="border-top-color:#10b981;">
        <div class="kpi-metrica-icono" style="background:#ecfdf5;color:#059669;">
          <i data-lucide="users-round"></i>
        </div>
        <div class="kpi-metrica-valor">${stats.activos}</div>
        <div class="kpi-metrica-titulo">Socios activos</div>
      </div>
      <div class="kpi-metrica" style="border-top-color:#ef4444;">
        <div class="kpi-metrica-icono" style="background:#fef2f2;color:#dc2626;">
          <i data-lucide="user-minus"></i>
        </div>
        <div class="kpi-metrica-valor">${stats.bajas_anio}</div>
        <div class="kpi-metrica-titulo">Bajas este año</div>
        <div class="kpi-metrica-sub">Año en curso</div>
      </div>
      <div class="kpi-metrica" style="border-top-color:#3b82f6;">
        <div class="kpi-metrica-icono" style="background:#eff6ff;color:#2563eb;">
          <i data-lucide="user-plus"></i>
        </div>
        <div class="kpi-metrica-valor">${stats.altas_mes}</div>
        <div class="kpi-metrica-titulo">Nuevas altas este mes</div>
        <div class="kpi-metrica-sub">Mes en curso</div>
      </div>
    </div>
  `;
  if (window.lucide) lucide.createIcons();
}

// ----------------------------------------------------------
// FORMULARIO ALTA / EDICIÓN
// ----------------------------------------------------------
function abrirFormSocio(id) {
  const socio = id ? _socios.find(s => s.id === id) : null;
  abrirModal(socio ? 'Editar socio' : 'Nuevo socio', `
    <form onsubmit="guardarSocio(event, ${id || ''})">
      <div class="campo">
        <label>Nombre *</label>
        <input type="text" id="soc-nombre" required
               value="${escapeHtml(socio ? socio.nombre : '')}">
      </div>
      <div class="campo">
        <label>Email *</label>
        <input type="email" id="soc-email" required
               value="${escapeHtml(socio ? socio.email : '')}">
      </div>
      <div class="campo">
        <label>Telefono</label>
        <input type="text" id="soc-telefono"
               value="${escapeHtml(socio && socio.telefono ? socio.telefono : '')}">
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
async function guardarSocio(evento, id) {
  evento.preventDefault();
  const datos = {
    nombre:   document.getElementById('soc-nombre').value,
    email:    document.getElementById('soc-email').value,
    telefono: document.getElementById('soc-telefono').value || null,
  };
  try {
    if (id) {
      await modificarDatos(`/socios/${id}`, datos);
      mostrarToast('Socio actualizado');
    } else {
      await enviarDatos('/socios', datos);
      mostrarToast('Socio creado');
    }
    cerrarModal();
    cargarSocios();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

// ----------------------------------------------------------
// DAR DE BAJA
// ----------------------------------------------------------
async function darDeBajaSocio(id) {
  confirmar('¿Dar de baja a este socio?', async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      await modificarDatos(`/socios/${id}`, { estado: 'baja', fecha_baja: hoy });
      mostrarToast('Socio dado de baja');
      cargarSocios();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  });
}

// ----------------------------------------------------------
// ELIMINAR
// ----------------------------------------------------------
async function eliminarSocio(id) {
  confirmar('¿Seguro que quieres eliminar este socio?', async () => {
    try {
      await borrarDatos(`/socios/${id}`);
      mostrarToast('Socio eliminado');
      cargarSocios();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  });
}
