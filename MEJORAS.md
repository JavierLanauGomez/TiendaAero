# Mejoras UX — TiendaAero

Cinco mejoras de experiencia de usuario implementadas sobre el frontend existente.
No requieren cambios en el backend ni en la base de datos.

---

## 1. Tecla Escape cierra el modal

**Archivo:** `frontend/js/app.js`

Antes el modal solo se cerraba haciendo clic en el fondo oscuro o en el botón ✕.
Ahora también se cierra pulsando `Escape`, comportamiento estándar que los usuarios esperan.

```js
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !document.getElementById('modal').classList.contains('oculta')) {
    cerrarModal();
  }
});
```

---

## 2. Auto-focus en el primer campo del modal

**Archivo:** `frontend/js/app.js`

Al abrir cualquier modal, el foco se coloca automáticamente en el primer `<input>` o
`<select>` disponible. El usuario puede empezar a escribir sin tener que hacer clic primero.

```js
requestAnimationFrame(() => {
  const primer = document.querySelector(
    '#modal-cuerpo input:not([type="hidden"]):not([disabled]), #modal-cuerpo select:not([disabled])'
  );
  if (primer) primer.focus();
});
```

---

## 3. Debounce en la búsqueda en tiempo real (150 ms)

**Archivo:** `frontend/js/app.js`

La función `inicializarBuscador` filtraba el DOM en cada pulsación de tecla.
Con un debounce de 150 ms solo filtra cuando el usuario ha dejado de escribir,
evitando operaciones innecesarias en tablas grandes.

```js
let _timer;
input.addEventListener('input', () => {
  clearTimeout(_timer);
  _timer = setTimeout(() => { /* filtrar filas */ }, 150);
});
```

---

## 4. Hamburger menu / sidebar drawer en móvil

**Archivos:** `frontend/index.html`, `frontend/js/app.js`, `frontend/css/estilos.css`

En pantallas ≤ 768 px el sidebar se ocultaba detrás del contenido sin forma de abrirlo.
Ahora:

- La sidebar se oculta fuera de pantalla (`translateX(-100%)`).
- Aparece un botón `☰` fijo en la esquina superior izquierda.
- Al pulsarlo la sidebar entra con animación suave y aparece un overlay oscuro.
- Al navegar a cualquier sección, o pulsar el overlay, la sidebar se cierra.

```js
function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const abierta = sidebar.classList.toggle('sidebar-abierta');
  if (overlay) overlay.classList.toggle('visible', abierta);
}
```

---

## 5. Fila completa resaltada cuando el stock está bajo

**Archivos:** `frontend/js/productos.js`, `frontend/css/estilos.css`

Antes solo el badge dentro de la celda indicaba stock bajo.
Ahora toda la fila tiene fondo rojo suave (`#fff7f7`) que se intensifica al hacer hover,
haciendo los productos críticos visibles de un vistazo sin tener que leer columna a columna.

```js
// productos.js — al generar las filas de la tabla
<tr${producto.stock <= producto.stock_minimo ? ' class="fila-stock-bajo"' : ''}>
```

```css
/* estilos.css */
tr.fila-stock-bajo > td          { background: #fff7f7; }
tr.fila-stock-bajo:hover > td    { background: #fee2e2 !important; }
```

---

*Autor: JavierLanauGomez*
