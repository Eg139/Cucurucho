// ==========================================
// CUCURUCHO POS - MÓDULO DE VENTAS Y CARRITO
// ==========================================

function toggleVentas() { 
  const body = document.getElementById('contenedorLista'); 
  const btn = document.getElementById('btnToggleVentas'); 
  if (body && btn) {
    body.classList.toggle('abierto'); 
    btn.innerText = body.classList.contains('abierto') ? '▲ Ocultar' : '▼ Ver'; 
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