// ==========================================
// CUCURUCHO POS - MÓDULO DE ONBOARDING
// ==========================================
const MAX_PRODUCTOS_CONFIG = 10;

function cambiarVista(mostrarBienvenida) {
  const b = document.getElementById('bienvenida');
  const a = document.getElementById('app');
  if (b && a) {
    b.style.setProperty('display', mostrarBienvenida ? 'flex' : 'none');
    a.style.setProperty('display', mostrarBienvenida ? 'none' : 'block');
  }
}

function initOnboarding() {
  const p1 = document.getElementById('paso1'); 
  const p2 = document.getElementById('paso2'); 
  const p3 = document.getElementById('paso3');

  let negocio = localStorage.getItem('negocio_nombre');
  let nombre = localStorage.getItem('vendedor_nombre');
  let tienePrecios = localStorage.getItem('productos_config');

  if (!p1 || !p2 || !p3) return;

  if (!negocio) {
    cambiarVista(true);
    p1.style.display = 'block'; 
    p2.style.display = 'none'; 
    p3.style.display = 'none';
  } else if (!nombre) {
    cambiarVista(true);
    p1.style.display = 'none'; 
    p2.style.display = 'block'; 
    p3.style.display = 'none';
    document.getElementById('tituloBienvenida').innerText = negocio.toUpperCase();
  } else if (!tienePrecios) {
    cambiarVista(true);
    p1.style.display = 'none'; 
    p2.style.display = 'none'; 
    p3.style.display = 'block';
    renderPasoPreciosDinamico();
  } else {
    cambiarVista(false);
    document.getElementById('brandTop').innerText = negocio.toUpperCase();
    document.getElementById('saludo').innerText = `Turno: ${nombre}`;
    if (typeof renderBotones === 'function') renderBotones(); 
    if (typeof render === 'function') render();
  }
  
  if (typeof cargarProductos === 'function') cargarProductos();
}

function agregarFilaProductoConfig(nombreInit = '', precioInit = '') {
  const contenedorFilas = document.getElementById('filasProductosContainer');
  if (!contenedorFilas) return;
  
  if (contenedorFilas.children.length >= MAX_PRODUCTOS_CONFIG) {
    Swal.fire({
      icon: 'info',
      title: 'Límite alcanzado',
      text: `Cucurucho POS permite hasta ${MAX_PRODUCTOS_CONFIG} productos en su versión gratuita.`,
      confirmButtonColor: '#3D2314'
    });
    return;
  }

  const fila = document.createElement('div');
  fila.className = 'fila-producto-config';
  fila.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 6px; align-items: center; margin-bottom: 6px;';
  
  const inputNombreId = 'prod_nombre_' + Date.now() + Math.random().toString(36).substr(2, 4);
  const inputPrecioId = 'prod_precio_' + Date.now() + Math.random().toString(36).substr(2, 4);

  fila.innerHTML = `
    <input type="text" id="${inputNombreId}" name="nombreProducto" class="input-nombre-prod" placeholder="Nombre" value="${nombreInit}" autocomplete="off" style="padding: 10px; font-size: 13px; margin: 0; border: 1px solid var(--c-border); border-radius: 8px;">
    <input type="number" id="${inputPrecioId}" name="precioProducto" class="input-precio-prod" placeholder="Precio" value="${precioInit}" autocomplete="off" style="padding: 10px; font-size: 13px; margin: 0; border: 1px solid var(--c-border); border-radius: 8px;">
    <button type="button" class="btn-eliminar-fila" style="background: transparent; border: none; color: #7A6354; font-weight: bold; cursor: pointer; padding: 6px; font-size: 16px;">✕</button>
  `;

  const btnEliminar = fila.querySelector('.btn-eliminar-fila');
  btnEliminar.addEventListener('click', () => {
    fila.remove();
  });
  
  contenedorFilas.appendChild(fila);
}

function guardarPrecios() {
  const contenedorFilas = document.getElementById('filasProductosContainer');
  if (!contenedorFilas) {
    console.error("No se encontró el contenedor de filas de productos.");
    return;
  }

  const filas = contenedorFilas.children;
  let nuevosProductos = [];

  for (let fila of filas) {
    const inputNombre = fila.querySelector('input[type="text"]');
    const inputPrecio = fila.querySelector('input[type="number"]');

    if (inputNombre && inputPrecio) {
      const nombre = inputNombre.value.trim();
      const precio = Number(inputPrecio.value);

      if (nombre && precio > 0) {
        const id = nombre.toLowerCase().replace(/[^a-z0-9]/g, '_');
        nuevosProductos.push({ id, nombre, precio });
      }
    }
  }

  if (nuevosProductos.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Faltan productos',
      text: 'Debes configurar al menos un producto con su nombre y precio válido para continuar.',
      confirmButtonColor: '#3D2314'
    });
    return;
  }

  let guardadoExitoso = guardarProductosPersonalizados(nuevosProductos);
  if (!guardadoExitoso) return;

  cambiarVista(false);
  
  const saludoEl = document.getElementById('saludo');
  if (saludoEl) {
    saludoEl.innerText = `Turno: ${localStorage.getItem('vendedor_nombre') || 'Vendedor'}`;
  }

  const brandTop = document.getElementById('brandTop');
  const negocioNombre = localStorage.getItem('negocio_nombre');
  if (brandTop && negocioNombre) {
    brandTop.innerText = negocioNombre.toUpperCase();
  }

  if (typeof renderBotones === 'function') renderBotones(); 
  if (typeof render === 'function') render();
}

function renderPasoPreciosDinamico() {
  const cont = document.getElementById('listaPreciosConfig');
  if (!cont) return;
  
  cont.innerHTML = `
    <div id="filasProductosContainer" style="display: flex; flex-direction: column; gap: 8px; max-height: 220px; overflow-y: auto; margin-bottom: 12px;"></div>
    <button type="button" onclick="agregarFilaProductoConfig()" style="background: var(--c-bg); color: var(--c-text); border: 1.5px dashed var(--c-border); margin-top: 0; font-size: 12px; padding: 10px; border-radius: 12px; cursor: pointer; font-weight: 700;">
        + Agregar producto
    </button>
  `;
  
  const contenedorFilas = document.getElementById('filasProductosContainer');
  contenedorFilas.innerHTML = '';
  
  if (productos && productos.length > 0) {
    productos.forEach(p => {
      agregarFilaProductoConfig(p.nombre, p.precio);
    });
  } else {
    agregarFilaProductoConfig('Producto 1', 3000);
    agregarFilaProductoConfig('Producto 2', 5000);
  }
}

async function editarPrecios() { 
  const res = await Swal.fire({
    title: '¿Editar catálogo?',
    text: 'Modificá los productos y precios de tu mostrador.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, editar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) { 
    cambiarVista(true);
    document.getElementById('paso1').style.display = 'none'; 
    document.getElementById('paso2').style.display = 'none'; 
    document.getElementById('paso3').style.display = 'block'; 
    renderPasoPreciosDinamico(); 
  } 
}

async function guardarNegocio() {
  let n = document.getElementById('negocioInput').value.trim();
  if (!n) { 
    Swal.fire({ title: 'Atención', text: 'Ingresá el nombre del negocio.', icon: 'warning' });
    return; 
  }
  localStorage.setItem('negocio_nombre', n);
  document.getElementById('paso1').style.display = 'none';
  document.getElementById('paso2').style.display = 'block';
  document.getElementById('tituloBienvenida').innerText = n.toUpperCase();
}

function guardarNombre() {
  let n = document.getElementById('nombreInput').value.trim();
  if (!n) {
    Swal.fire({ title: 'Atención', text: 'Ingresá tu nombre.', icon: 'warning' });
    return;
  }
  localStorage.setItem('vendedor_nombre', n);
  document.getElementById('paso2').style.display = 'none';
  document.getElementById('paso3').style.display = 'block';
  renderPasoPreciosDinamico();
}

async function cambiarUsuario() { 
  const res = await Swal.fire({
    title: '¿Cerrar turno?',
    text: 'Esto NO borra las ventas, solo cambia de vendedor.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cambiar',
    cancelButtonText: 'Cancelar'
  });

  if (res.isConfirmed) { 
    localStorage.removeItem('vendedor_nombre'); 
    location.reload(); 
  } 
}