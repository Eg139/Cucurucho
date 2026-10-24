// GESTIÓN DE VISTAS, INTERFAZ Y REPORTES (100% Local y Gratuito)
const MAX_PRODUCTOS_CONFIG = 10;

// Función auxiliar para alternar vistas de forma limpia
function cambiarVista(mostrarBienvenida) {
  const b = document.getElementById('bienvenida');
  const a = document.getElementById('app');
  if (b && a) {
    b.style.setProperty('display', mostrarBienvenida ? 'flex' : 'none');
    a.style.setProperty('display', mostrarBienvenida ? 'none' : 'block');
  }
}

function init() {
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
    renderBotones(); 
    render();
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

  // VALIDACIÓN CENTRALIZADA: Respeta el límite estricto de 10 ítems (config.js)
  let guardadoExitoso = guardarProductosPersonalizados(nuevosProductos);
  
  if (!guardadoExitoso) {
    return; 
  }

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

function toggleVentas() { 
  const body = document.getElementById('contenedorLista'); 
  const btn = document.getElementById('btnToggleVentas'); 
  if (body && btn) {
    body.classList.toggle('abierto'); 
    btn.innerText = body.classList.contains('abierto') ? '▲ Ocultar' : '▼ Ver'; 
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

function renderBotones() {
  const c = document.getElementById('botones'); 
  if (!c) return; 
  c.innerHTML = '';
  
  productos.forEach(p => {
    let b = document.createElement('button'); 
    b.className = 'prod-btn';
    b.innerHTML = `<b>${p.nombre}</b><span class="prod-desc">Mostrador</span><span class="prod-price">$${p.precio.toLocaleString()}</span>`;
    b.onclick = () => seleccionarProducto(p, b); 
    c.appendChild(b);
  });
}

function renderCarrito() {
  const bar = document.getElementById('carrito-bar');
  const lista = document.getElementById('carritoLista');
  const preview = document.getElementById('previewPY');
  
  if (carrito.length === 0) { 
    if (bar) bar.style.display = 'none'; 
    return; 
  }
  
  if (bar) bar.style.display = 'block';
  let total = 0, cant = 0; 
  if (lista) lista.innerHTML = '';
  
  carrito.forEach((it) => {
    total += it.precio * it.cant; 
    cant += it.cant;
    if (lista) {
      // CORREGIDO: Operador * aplicado correctamente sin saltos de línea conflictivos
      lista.innerHTML += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed rgba(255,255,255,0.2);font-size:11px"><span>${it.nombre} x${it.cant}</span><span>$${(it.precio * it.cant).toLocaleString()}</span></div>`;
    }
  });
  
  document.getElementById('carritoCount').innerText = cant + ' items';
  document.getElementById('carritoTotalBar').innerText = '$' + total.toLocaleString();
  
  let rec = Math.round(total * COMISION_PY / 100);
  if (preview) {
    preview.style.display = 'block';
    preview.innerHTML = `Pedidos Ya: $${total.toLocaleString()} + $${rec.toLocaleString()} = $${(total + rec).toLocaleString()}`;
  }
  render();
}

function abrirPagar() { document.getElementById('modalPagar').classList.add('open'); }
function cerrarPagar() { document.getElementById('modalPagar').classList.remove('open'); }

async function cerrarTurno() { 
  let ventasHoy = window._ventasHoy || []; 
  if (ventasHoy.length === 0) { 
    Swal.fire({ title: 'Sin ventas', text: 'No hay ventas registradas en este turno.', icon: 'info' }); 
    return; 
  } 
  let bruto = ventasHoy.reduce((a, b) => a + (b.vFinal || b.v), 0); 
  let com = ventasHoy.reduce((a, b) => a + (b.vComision || 0), 0); 
  let neto = bruto - com; 
  let porMetodo = {}; 
  
  ventasHoy.forEach(v => { 
    let m = v.metodo || 'OTRO'; 
    if (!porMetodo[m]) porMetodo[m] = { cant: 0, total: 0 }; 
    porMetodo[m].cant++; 
    porMetodo[m].total += (v.vFinal || v.v); 
  }); 
  
  let detalleMetodo = Object.entries(porMetodo)
    .map(([k, v]) => `<div><b>${k}:</b> ${v.cant} ventas ($${v.total.toLocaleString()})</div>`)
    .join(''); 

  const htmlMsg = `
    <div style="text-align:left;font-size:13px;line-height:1.5;margin-top:10px">
      <p><b>Vendedor:</b> ${localStorage.getItem('vendedor_nombre')}</p>
      <p><b>Fecha:</b> ${HOY} | <b>Ventas:</b> ${ventasHoy.length}</p>
      <hr style="border:0;border-top:1px solid var(--c-border);margin:8px 0">
      <p><b>NETO:</b> $${neto.toLocaleString()}</p>
      <p><b>BRUTO:</b> $${bruto.toLocaleString()}</p>
      <p><b>COMISIÓN PY:</b> $${com.toLocaleString()}</p>
      <hr style="border:0;border-top:1px solid var(--c-border);margin:8px 0">
      <div style="margin-bottom:8px">${detalleMetodo}</div>
      <small style="color:var(--c-muted)">Se exportará el CSV y HOY quedará en 0.</small>
    </div>
  `;

  const res = await Swal.fire({
    title: '¿Cerrar turno?',
    html: htmlMsg,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, cerrar turno',
    cancelButtonText: 'Cancelar'
  });

  if (!res.isConfirmed) return; 

  exportarDiario(); 
  let cierres = JSON.parse(localStorage.getItem('cierres') || '[]'); 
  cierres.push({ 
    fecha: HOY, 
    hora: new Date().toLocaleTimeString(), 
    vendedor: localStorage.getItem('vendedor_nombre'), 
    bruto, 
    comision: com, 
    neto, 
    cantidad: ventasHoy.length, 
    porMetodo, 
    ventas: ventasHoy 
  }); 
  localStorage.setItem('cierres', JSON.stringify(cierres)); 
  ventas = ventas.filter(v => v.f !== HOY); 
  if (typeof guardar === 'function') guardar(); 

  Swal.fire({
    title: 'Turno cerrado',
    text: 'Se ha exportado el reporte y el día quedó en $0.',
    icon: 'success'
  });
}

async function verCierres() { 
  let cierres = JSON.parse(localStorage.getItem('cierres') || '[]'); 
  if (cierres.length === 0) { 
    Swal.fire({ title: 'Sin cierres', text: 'No hay cierres guardados aún.', icon: 'info' }); 
    return; 
  } 
  const lista = document.getElementById('listaCierres'); 
  if (!lista) return;
  
  lista.innerHTML = ''; 
  cierres.slice().reverse().forEach((c) => { 
    let metodos = Object.entries(c.porMetodo || {}).map(([k, v]) => `${k} $${v.total.toLocaleString()}`).join(' | '); 
    lista.innerHTML += `<div style="background:var(--c-bg);border:1px solid var(--c-border);border-radius:12px;padding:12px;margin-top:10px"><div style="display:flex;justify-content:space-between"><b style="color:var(--c-brand)">${c.fecha} ${c.hora}</b><small style="opacity:.6">${c.vendedor}</small></div><div style="margin-top:6px;font-size:13px">NETO <b>$${c.neto.toLocaleString()}</b> | Bruto $${c.bruto.toLocaleString()}</div><div style="margin-top:4px;font-size:11px;color:var(--c-muted)">${c.cantidad} ventas | ${metodos}</div></div>`; 
  }); 
  document.getElementById('modalCierres').classList.add('open'); 
}

function cerrarModal() { document.getElementById('modalCierres').classList.remove('open'); }

function render() {
  const lista = document.getElementById('lista');
  const titulo = document.getElementById('tituloVentas');
  let { m: mesActual, a: anioActual } = getMesAnio(HOY);
  
  let ventasMesActual = ventas.filter(v => {
    try { let { m, a } = getMesAnio(v.f); return m === mesActual && a === anioActual; } catch (e) { return true; }
  });
  
  let ventasHoy = ventasMesActual.filter(v => v.f === HOY);
  let brutoHoy = ventasHoy.reduce((a, b) => a + (b.vFinal || b.v), 0);
  let netoHoy = brutoHoy - ventasHoy.reduce((a, b) => a + (b.vComision || 0), 0);

  document.getElementById('totalHoy').innerText = '$' + netoHoy.toLocaleString();
  document.getElementById('cantHoy').innerText = ventasHoy.length;
  document.getElementById('promHoy').innerHTML = '$' + (ventasHoy.length ? Math.round(netoHoy / ventasHoy.length) : 0).toLocaleString() + ' <span>+12%</span>';

  if (titulo) titulo.innerText = `VENTAS DEL DÍA (${ventasHoy.length})`;

  if (lista) {
    if (ventasHoy.length === 0) {
      lista.innerHTML = '<div style="opacity:.5;padding:10px;text-align:center">Sin ventas aún</div>';
    } else {
      lista.innerHTML = ventasHoy.slice().reverse().map(v => `
        <div class="venta-item">
          <span>${v.h || ''} ${v.p}</span>
          <span>$${(v.vFinal || v.v).toLocaleString()}</span>
        </div>
      `).join('');
    }
  }

  window._ventasHoy = ventasHoy;
  window._ventasMesActual = ventasMesActual;
}

async function exportarDiario() { 
  let negocio = localStorage.getItem('negocio_nombre') || 'NEGOCIO'; 
  let nombre = localStorage.getItem('vendedor_nombre'); 
  let ventasHoy = window._ventasHoy || []; 
  
  if (ventasHoy.length === 0) { 
    Swal.fire({ title: 'Sin ventas', text: 'No hay ventas registradas hoy.', icon: 'info' }); 
    return; 
  } 
  
  let brutoHoy = ventasHoy.reduce((a, b) => a + (b.vFinal || b.v), 0); 
  let comisionHoy = ventasHoy.reduce((a, b) => a + (b.vComision || 0), 0); 
  let netoHoy = brutoHoy - comisionHoy; 
  let resumen = {}; 
  
  ventasHoy.forEach(v => { 
    if (!resumen[v.p]) resumen[v.p] = { c: 0, m: 0, com: 0 }; 
    resumen[v.p].c++; 
    resumen[v.p].m += (v.vFinal || v.v); 
    resumen[v.p].com += (v.vComision || 0); 
  }); 

  let csv = `sep=;\n${negocio.toUpperCase()} VENTA DIARIA\nVendedor;${nombre}\nFecha;${HOY}\nHora cierre;${new Date().toLocaleTimeString()}\n\nTOTAL NETO;$${netoHoy};BRUTO;$${brutoHoy};COMISION;$${comisionHoy}\n\nRESUMEN POR PRODUCTO\nProducto;Cantidad;Total;Comision\n`; 
  Object.entries(resumen).forEach(([p, d]) => { csv += `"${p}";${d.c};${d.m};${d.com}\n`; }); 
  csv += `\nDETALLE\nHora;Producto;Precio Base;Comision;Total;Metodo\n`; 
  ventasHoy.forEach(v => { csv += `${v.h};"${v.p}";${v.vBase || v.v};${v.vComision || 0};${v.vFinal || v.v};${v.metodo || ''}\n`; }); 
  
  let blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); 
  let a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob); 
  a.download = `CIERRE-${negocio}-${nombre}-${HOY.replaceAll('/', '-')}-NETO$${netoHoy}.csv`; 
  a.click(); 
}

async function exportarMes() { 
  let negocio = localStorage.getItem('negocio_nombre') || 'NEGOCIO'; 
  let nombre = localStorage.getItem('vendedor_nombre'); 
  let ventasMesActual = window._ventasMesActual || []; 
  let cierres = JSON.parse(localStorage.getItem('cierres') || '[]'); 
  let { m: mesActual, a: anioActual } = getMesAnio(HOY); 
  
  let cierresMes = cierres.filter(c => { 
    try { let { m, a } = getMesAnio(c.fecha); return m === mesActual && a === anioActual; } catch (e) { return true; } 
  }); 
  
  let todasVentasMes = [...ventasMesActual]; 
  cierresMes.forEach(c => { todasVentasMes.push(...(c.ventas || [])); }); 
  
  if (todasVentasMes.length === 0) { 
    Swal.fire({ title: 'Sin datos', text: 'No hay ventas registradas este mes.', icon: 'info' }); 
    return; 
  } 
  
  let brutoMes = todasVentasMes.reduce((a, b) => a + (b.vFinal || b.v), 0); 
  let comMes = todasVentasMes.reduce((a, b) => a + (b.vComision || 0), 0); 
  let netoMes = brutoMes - comMes; 
  let { m, a: anio } = getMesAnio(HOY); 
  let resumen = {}; 
  
  todasVentasMes.forEach(v => { 
    if (!resumen[v.p]) resumen[v.p] = { c: 0, m: 0 }; 
    resumen[v.p].c++; 
    resumen[v.p].m += (v.vFinal || v.v); 
  }); 

  let csv = `sep=;\n${negocio.toUpperCase()} REPORTE MENSUAL\nVendedor;${nombre}\nPeriodo;Del 1/${m}/${anio} al ${HOY}\nNeto;$${netoMes};Bruto;$${brutoMes};Comision;$${comMes}\nCierres incluidos;${cierresMes.length}\n\nRESUMEN POR PRODUCTO\nProducto;Cantidad;Total\n`; 
  Object.entries(resumen).forEach(([p, d]) => { csv += `"${p}";${d.c};${d.m}\n`; }); 
  csv += `\nDETALLE\nFecha;Hora;Producto;Base;Comision;Total;Metodo;Vendedor\n`; 
  todasVentasMes.forEach(v => csv += `${v.f};${v.h};"${v.p}";${v.vBase || v.v};${v.vComision || 0};${v.vFinal || v.v};${v.metodo || ''};${v.vendedor}\n`); 
  
  let blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); 
  let aEl = document.createElement('a'); 
  aEl.href = URL.createObjectURL(blob); 
  aEl.download = `MES-COMPLETO-${m}-${anio}-${negocio}-NETO$${netoMes}.csv`; 
  aEl.click(); 
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker registrado con éxito:', reg.scope))
      .catch(err => console.log('Error al registrar el Service Worker:', err));
  });
}

init();