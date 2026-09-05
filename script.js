// CONFIG SUPABASE
const SUPA_URL = "https://oqnhwuzvfpsxnqffyhlw.supabase.co";
const SUPA_KEY = "sb_publishable_0Ylkyn9TvZaP3q1Bz9da7A_ZkM8Fnzp";
const supabaseClient = supabase.createClient(SUPA_URL, SUPA_KEY);

const PRODUCTOS_DEFAULT = [
  { id: "cuarto", nombre: "1/4 KG", precio: 4500 },
  { id: "medio", nombre: "1/2 KG", precio: 8000 },
  { id: "kilo", nombre: "1 KG", precio: 14500 },
  { id: "vaso", nombre: "Vaso", precio: 3000 },
  { id: "cucurucho", nombre: "Cucurucho", precio: 3500 },
  { id: "conodoble", nombre: "Cono doble", precio: 5000 }
];

let productos = JSON.parse(localStorage.getItem('productos_config') || 'null') || PRODUCTOS_DEFAULT;
let carrito = [];
let ventas = JSON.parse(localStorage.getItem('ventas_mes') || '[]');
const HOY = new Date().toLocaleDateString();
let COMISION_PY = Number(localStorage.getItem('comisionPY') || 35);

async function checkInvite() {
  return true; // MODO PRUEBA TOTAL
}

// UN SOLO INIT UNIFICADO Y ASYNC
async function init() {
  const b = document.getElementById('bienvenida'); 
  const a = document.getElementById('app'); 
  const p1 = document.getElementById('paso1'); 
  const p2 = document.getElementById('paso2'); 
  const p3 = document.getElementById('paso3');

  // --- PROCESAMIENTO AUTOMÁTICO DE TOKEN DE INVITACIÓN VÍA RPC SECURE ---
// --- PROCESAMIENTO AUTOMÁTICO DE TOKEN VÍA RPC SECURE + MODAL ---
  const currentUrl = new URL(window.location.href);
  const inviteToken = currentUrl.searchParams.get('invite');

  if (inviteToken) {
    if (b) b.style.setProperty('display', 'flex', 'important');
    if (a) a.style.setProperty('display', 'none', 'important');

    const cleanToken = inviteToken.trim();

    // 1. Validar token en Postgres
    const { data: rpcData, error: rpcError } = await supabaseClient
      .rpc('validar_y_usar_invitacion', { p_token: cleanToken });

    if (rpcError || !rpcData || rpcData.length === 0 || !rpcData[0].valido) {
      console.error("Error al validar token vía RPC:", rpcError);
      alert("El enlace de invitación es inválido, ya fue utilizado o ha expirado.");
      currentUrl.searchParams.delete('invite');
      window.location.href = currentUrl.toString();
      return;
    }

    const inviteData = rpcData[0];

    // 2. Mostrar Modal estilizado y esperar credenciales del usuario
    const modal = document.getElementById('modalRegistroInvite');
    const titulo = document.getElementById('modalHeladeriaTitulo');
    const msg = document.getElementById('msgInvite');
    const btn = document.getElementById('btnConfirmarRegistro');

    if (inviteData.heladeria_nombre) {
      titulo.innerText = inviteData.heladeria_nombre.toUpperCase();
    }
    
    modal.classList.add('open');

    // Promesa para capturar el click del botón sin bloquear el hilo principal
    const credenciales = await new Promise((resolve) => {
      btn.onclick = () => {
        const email = document.getElementById('inviteEmail').value.trim();
        const pass = document.getElementById('invitePass').value;

        if (!email || !pass) {
          msg.innerText = "Completá todos los campos.";
          return;
        }
        if (pass.length < 6) {
          msg.innerText = "La contraseña debe tener al menos 6 caracteres.";
          return;
        }

        msg.style.color = "#e9c891";
        msg.innerText = "Creando cuenta...";
        btn.disabled = true;

        resolve({ email, pass });
      };
    });

    // 3. Registrar usuario en Auth
    const { error: authError } = await supabaseClient.auth.signUp({
      email: credenciales.email,
      password: credenciales.pass
    });

    if (authError && !authError.message.includes("already registered")) {
      msg.style.color = "#ff6b6b";
      msg.innerText = authError.message;
      btn.disabled = false;
      return;
    }

    // 4. Iniciar sesión automáticamente
    const { error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: credenciales.email,
      password: credenciales.pass
    });

    if (loginError) {
      msg.style.color = "#ff6b6b";
      msg.innerText = loginError.message;
      btn.disabled = false;
      return;
    }

    // 5. Guardar datos locales y recargar app limpia
    if (inviteData.heladeria_nombre) {
      localStorage.setItem('negocio_nombre', inviteData.heladeria_nombre);
    }

    modal.classList.remove('open');
    currentUrl.searchParams.delete('invite');
    window.history.replaceState({}, document.title, currentUrl.toString());
    location.reload();
    return;
  }
  // ----------------------------------------------------

  // --- CHEQUEO SUPABASE NORMAL (LOGIN) ---
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    if (b) b.style.setProperty('display', 'flex', 'important');
    if (a) a.style.setProperty('display', 'none', 'important');
    if (p1) p1.style.display = 'none';
    if (p2) p2.style.display = 'none';
    if (p3) {
      p3.style.display = 'block';
      p3.innerHTML = `
        <p class="paso-label">Iniciar sesión</p>
        <input id="email" placeholder="Email">
        <input id="pass" type="password" placeholder="Contraseña" style="margin-top:10px">
        <button onclick="loginCucurucho()" style="margin-top:14px">ENTRAR</button>
        <p id="msg" style="font-size:11px;color:#e9c891;text-align:center;margin-top:10px;min-height:14px"></p>
      `;
    }
    document.getElementById('tituloBienvenida').innerText = "CUCURUCHO";
    document.getElementById('subBienvenida').innerText = "by NaluSoft";
    return; 
  }

  let negocio = localStorage.getItem('negocio_nombre');
  let nombre = localStorage.getItem('vendedor_nombre');
  let tienePrecios = localStorage.getItem('productos_config');

  if (!b || !a) return;

  if (!negocio) {
    b.style.setProperty('display', 'flex', 'important');
    a.style.setProperty('display', 'none', 'important');
    p1.style.display = 'block'; p2.style.display = 'none'; p3.style.display = 'none';
    if (p3.querySelector('#email')) { location.reload(); return; }
  } else if (!nombre) {
    b.style.setProperty('display', 'flex', 'important');
    a.style.setProperty('display', 'none', 'important');
    p1.style.display = 'none'; p2.style.display = 'block'; p3.style.display = 'none';
  } else if (!tienePrecios) {
    b.style.setProperty('display', 'flex', 'important');
    a.style.setProperty('display', 'none', 'important');
    p1.style.display = 'none'; p2.style.display = 'none'; p3.style.display = 'block';
    if (p3.querySelector('#email')) {
       p3.innerHTML = `<p class="paso-label">Precios</p><div id="listaPreciosConfig"></div><button onclick="guardarPrecios()">GUARDAR Y ENTRAR</button>`;
    }
    renderPasoPrecios();
  } else {
    b.style.setProperty('display', 'none', 'important');
    a.style.setProperty('display', 'block', 'important');
    document.getElementById('saludo').innerText = `Turno: ${nombre}`;
    renderBotones(); render();
  }
  cargarProductos();
}

async function loginCucurucho() {
  const e = document.getElementById('email')?.value.trim();
  const p = document.getElementById('pass')?.value;
  const msg = document.getElementById('msg');
  if (!e || !p) { msg.innerText = "Completá email y contraseña"; return; }
  msg.innerText = "Ingresando...";
  const { error } = await supabaseClient.auth.signInWithPassword({ email: e, password: p });
  if (error) { msg.innerText = error.message; return; }
  location.reload();
}

function getMesAnio(fechaStr) { 
  try { 
    let parts = fechaStr.split('/'); 
    return { m: parseInt(parts[1]), a: parseInt(parts[2]) }; 
  } catch (e) { 
    return { m: new Date().getMonth() + 1, a: new Date().getFullYear() }; 
  } 
}

function cargarProductos() { 
  let guardados = JSON.parse(localStorage.getItem('productos_config') || 'null'); 
  if (!guardados) { 
    productos = PRODUCTOS_DEFAULT; 
  } else { 
    productos = guardados; 
    PRODUCTOS_DEFAULT.forEach(def => { 
      if (!productos.find(p => p.id === def.id)) productos.push(def); 
    }); 
  } 
  renderBotones(); 
}

function renderPasoPrecios() {
  const cont = document.getElementById('listaPreciosConfig');
  if (!cont) return;
  cont.innerHTML = '';
  productos.forEach(p => {
    cont.innerHTML += `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#1a1a1d;border:1px solid #2a2a2e;border-radius:10px;margin-bottom:8px">
        <label style="font-size:12px;font-weight:700">${p.nombre}</label>
        <input type="number" id="precio_${p.id}" value="${p.precio}" style="width:110px !important;margin:0 !important;text-align:center;font-weight:800;background:#252529 !important;border:1px solid #333 !important;color:#fff !important;border-radius:8px;padding:8px">
      </div>`;
  });
}

function guardarPrecios() {
  let nuevos = [];
  productos.forEach(p => {
    let input = document.getElementById(`precio_${p.id}`);
    let val = input ? Number(input.value) : p.precio;
    if (!val || val <= 0) val = p.precio;
    nuevos.push({ id: p.id, nombre: p.nombre, precio: val });
  });
  productos = nuevos;
  localStorage.setItem('productos_config', JSON.stringify(productos));

  document.getElementById('bienvenida').classList.add('oculta');
  document.getElementById('bienvenida').style.setProperty('display', 'none', 'important');
  document.getElementById('app').classList.remove('oculta');
  document.getElementById('app').style.setProperty('display', 'block', 'important');

  document.getElementById('saludo').innerText = `Turno: ${localStorage.getItem('vendedor_nombre')}`;
  renderBotones(); 
  render();
}

function editarPrecios() { 
  if (confirm('¿Editar precios?')) { 
    localStorage.removeItem('productos_config'); 
    productos = PRODUCTOS_DEFAULT; 
    document.getElementById('app').style.display = 'none'; 
    document.getElementById('bienvenida').style.display = 'flex'; 
    document.getElementById('paso1').style.display = 'none'; 
    document.getElementById('paso2').style.display = 'none'; 
    document.getElementById('paso3').style.display = 'block'; 
    renderPasoPrecios(); 
  } 
}

function toggleVentas() { 
  const body = document.getElementById('contenedorLista'); 
  const btn = document.getElementById('btnToggleVentas'); 
  body.classList.toggle('abierto'); 
  btn.innerText = body.classList.contains('abierto') ? '▲ Ocultar' : '▼ Ver'; 
}

function guardarNegocio() {
  let n = document.getElementById('negocioInput').value.trim();
  if (!n) { alert('Poné el nombre'); return; }
  localStorage.setItem('negocio_nombre', n);
  document.getElementById('paso1').style.display = 'none';
  document.getElementById('paso2').style.display = 'block';
  document.getElementById('tituloBienvenida').innerText = n.toUpperCase();
}

function guardarNombre() {
  let n = document.getElementById('nombreInput').value.trim();
  if (!n) return;
  localStorage.setItem('vendedor_nombre', n);
  document.getElementById('paso2').style.display = 'none';
  document.getElementById('paso3').style.display = 'block';
  renderPasoPrecios();
}

// 1. Cambia solo el nombre del empleado del turno actual (Mantiene la sesión de Supabase)
function cambiarUsuario() { 
  if (confirm('¿Cerrar turno? Esto NO cierra la caja, solo cambia de vendedor.')) { 
    localStorage.removeItem('vendedor_nombre'); 
    location.reload(); 
  } 
}

// 2. Destruye la sesión de Supabase y sale completamente del sistema
async function cerrarSesion() {
  if (confirm('¿Seguro que querés cerrar la sesión de la heladería?')) {
    try {
      // Destruye el token activo en el servidor de Supabase
      await supabaseClient.auth.signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      // Limpia todo el almacenamiento local
      localStorage.clear();
      sessionStorage.clear();
      
      // Recarga la página para mostrar el login principal
      location.reload();
    }
  }
}

function cambiarNegocio() { 
  if (confirm('¿Cambiar nombre del negocio? Se borrarán precios y cierres')) { 
    localStorage.removeItem('negocio_nombre'); 
    localStorage.removeItem('vendedor_nombre'); 
    localStorage.removeItem('productos_config'); 
    localStorage.removeItem('ventas_mes'); 
    localStorage.removeItem('cierres'); 
    location.reload(); 
  } 
}

function guardar() { 
  localStorage.setItem('ventas_mes', JSON.stringify(ventas)); 
  render(); 
}

function renderBotones() {
  const c = document.getElementById('botones'); if (!c) return; c.innerHTML = '';
  const d = { 
    "1/4 KG": "Gelato para llevar • 250g", 
    "1/2 KG": "Gelato para llevar • 500g", 
    "1 KG": "Gelato para llevar • 1,000g", 
    "Vaso": "Copa de gelato • 120g", 
    "Cucurucho": "Cono clásico • 1 unidad", 
    "Cono doble": "Cono doble • 2 porciones" 
  };
  productos.forEach(p => {
    let b = document.createElement('button'); b.className = 'prod-btn';
    b.innerHTML = `<b>${p.nombre}</b><span class="prod-desc">${d[p.nombre] || ''}</span><span class="prod-price">$${p.precio.toLocaleString()}</span>`;
    b.onclick = () => seleccionarProducto(p, b); c.appendChild(b);
  });
}

function seleccionarProducto(p, btn) { 
  btn.classList.add('active'); 
  setTimeout(() => btn.classList.remove('active'), 150); 
  let idx = carrito.findIndex(c => c.id === p.id); 
  if (idx >= 0) { 
    carrito[idx].cant++; 
  } else { 
    carrito.push({ id: p.id, nombre: p.nombre, precio: p.precio, cant: 1 }); 
  } 
  renderCarrito(); 
}

function renderCarrito() {
  const bar = document.getElementById('carrito-bar');
  const lista = document.getElementById('carritoLista');
  const preview = document.getElementById('previewPY');
  if (carrito.length === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'block';
  let total = 0, cant = 0; lista.innerHTML = '';
  carrito.forEach((it) => {
    total += it.precio * it.cant; cant += it.cant;
    lista.innerHTML += `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dashed #222;font-size:11px"><span>${it.nombre} x${it.cant}</span><span>$${(it.precio * it.cant).toLocaleString()}</span></div>`;
  });
  document.getElementById('carritoCount').innerText = cant + ' items';
  document.getElementById('carritoTotalBar').innerText = '$' + total.toLocaleString();
  document.getElementById('carritoTotal')?.remove();
  let rec = Math.round(total * COMISION_PY / 100);
  preview.style.display = 'block';
  preview.innerHTML = `Pedidos Ya: $${total.toLocaleString()} + $${rec.toLocaleString()} = $${(total + rec).toLocaleString()}`;
  render();
}

function abrirPagar() { document.getElementById('modalPagar').classList.add('open'); }
function cerrarPagar() { document.getElementById('modalPagar').classList.remove('open'); }
function cambiarCant(index, delta) { 
  carrito[index].cant += delta; 
  if (carrito[index].cant <= 0) carrito.splice(index, 1); 
  renderCarrito(); 
}
function vaciarCarrito() { carrito = []; renderCarrito(); }

function cobrar(metodo) { 
  if (carrito.length === 0) return; 
  let esPY = metodo === 'PEDIDOSYA'; 
  carrito.forEach(item => { 
    for (let k = 0; k < item.cant; k++) { 
      ventas.push({ 
        f: HOY, 
        h: new Date().toLocaleTimeString(), 
        p: item.nombre, 
        vBase: item.precio, 
        vComision: esPY ? Math.round(item.precio * COMISION_PY / 100) : 0, 
        vFinal: item.precio + (esPY ? Math.round(item.precio * COMISION_PY / 100) : 0), 
        v: item.precio, 
        metodo: metodo, 
        vendedor: localStorage.getItem('vendedor_nombre') 
      }); 
    } 
  }); 
  guardar(); 
  carrito = []; 
  renderCarrito(); 
}

function cerrarTurno() { 
  let ventasHoy = window._ventasHoy || []; 
  if (ventasHoy.length === 0) { alert('No hay ventas en este turno para cerrar'); return; } 
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
  let detalleMetodo = Object.entries(porMetodo).map(([k, v]) => `${k}: ${v.cant} ventas $${v.total.toLocaleString()}`).join('\n'); 
  if (!confirm(`¿CERRAR TURNO?\n\nVendedor: ${localStorage.getItem('vendedor_nombre')}\nFecha: ${HOY}\nVentas: ${ventasHoy.length}\n\nNETO: $${neto.toLocaleString()}\nBRUTO: $${bruto.toLocaleString()}\nCOMISION PY: $${com.toLocaleString()}\n\n${detalleMetodo}\n\nSe exportará el CSV y HOY quedará en 0. El MES seguirá sumando.`)) return; 
  exportarDiario(); 
  let cierres = JSON.parse(localStorage.getItem('cierres') || '[]'); 
  cierres.push({ fecha: HOY, hora: new Date().toLocaleTimeString(), vendedor: localStorage.getItem('vendedor_nombre'), bruto, comision: com, neto, cantidad: ventasHoy.length, porMetodo, ventas: ventasHoy }); 
  localStorage.setItem('cierres', JSON.stringify(cierres)); 
  ventas = ventas.filter(v => v.f !== HOY); 
  guardar(); 
  alert('✅ Turno cerrado. HOY en 0'); 
}

function verCierres() { 
  let cierres = JSON.parse(localStorage.getItem('cierres') || '[]'); 
  if (cierres.length === 0) { alert('No hay cierres guardados'); return; } 
  const lista = document.getElementById('listaCierres'); 
  lista.innerHTML = ''; 
  cierres.slice().reverse().forEach((c) => { 
    let metodos = Object.entries(c.porMetodo || {}).map(([k, v]) => `${k} $${v.total.toLocaleString()}`).join(' | '); 
    lista.innerHTML += `<div style="background:#111;border:1px solid #232323;border-radius:12px;padding:12px;margin-top:10px"><div style="display:flex;justify-content:space-between"><b style="color:var(--naranja)">${c.fecha} ${c.hora}</b><small style="opacity:.5">${c.vendedor}</small></div><div style="margin-top:6px;font-size:13px">NETO <b>$${c.neto.toLocaleString()}</b> | Bruto $${c.bruto.toLocaleString()} | Com $${c.comision.toLocaleString()}</div><div style="margin-top:4px;font-size:11px;opacity:.6">${c.cantidad} ventas | ${metodos}</div></div>`; 
  }); 
  document.getElementById('modalCierres').classList.add('open'); 
}

function cerrarModal() { document.getElementById('modalCierres').classList.remove('open'); }

function render() {
  const lista = document.getElementById('lista');
  const titulo = document.getElementById('tituloVentas') || document.getElementById('ventasTitulo');
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
          <span>${v.h || ''} - ${v.p}</span>
          <span>$${(v.vFinal || v.v).toLocaleString()}</span>
        </div>
      `).join('');
    }
  }

  window._ventasHoy = ventasHoy;
  window._ventasMesActual = ventasMesActual;
}

function exportarDiario() { 
  let negocio = localStorage.getItem('negocio_nombre') || 'HELADERIA'; 
  let nombre = localStorage.getItem('vendedor_nombre'); 
  let ventasHoy = window._ventasHoy || []; 
  if (ventasHoy.length === 0) { alert('No hay ventas de hoy'); return; } 
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
  let csv = `${negocio.toUpperCase()} - VENTA DIARIA - TURNO\nVendedor,${nombre}\nFecha,${HOY}\nHora cierre,${new Date().toLocaleTimeString()}\n\nTOTAL NETO,$${netoHoy},BRUTO,$${brutoHoy},COMISION,$${comisionHoy}\n\nRESUMEN POR PRODUCTO\nProducto,Cantidad,Total,Comision\n`; 
  Object.entries(resumen).forEach(([p, d]) => { csv += `"${p}",${d.c},${d.m},${d.com}\n`; }); 
  csv += `\nDETALLE\nHora,Producto,Precio Base,Comision,Total,Metodo\n`; 
  ventasHoy.forEach(v => { csv += `${v.h},"${v.p}",${v.vBase || v.v},${v.vComision || 0},${v.vFinal || v.v},${v.metodo || ''}\n`; }); 
  let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
  let a = document.createElement('a'); 
  a.href = URL.createObjectURL(blob); 
  a.download = `CIERRE-${negocio}-${nombre}-${HOY.replaceAll('/', '-')}-${new Date().toLocaleTimeString().replaceAll(':', '-')}-NETO$${netoHoy}.csv`; 
  a.click(); 
}

function exportarMes() { 
  let negocio = localStorage.getItem('negocio_nombre') || 'HELADERIA'; 
  let nombre = localStorage.getItem('vendedor_nombre'); 
  let ventasMesActual = window._ventasMesActual || []; 
  let cierres = JSON.parse(localStorage.getItem('cierres') || '[]'); 
  let { m: mesActual, a: anioActual } = getMesAnio(HOY); 
  let cierresMes = cierres.filter(c => { 
    try { let { m, a } = getMesAnio(c.fecha); return m === mesActual && a === anioActual; } catch (e) { return true; } 
  }); 
  let todasVentasMes = [...ventasMesActual]; 
  cierresMes.forEach(c => { todasVentasMes.push(...(c.ventas || [])); }); 
  if (todasVentasMes.length === 0) { alert('No hay ventas este mes'); return; } 
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
  let csv = `${negocio.toUpperCase()} - REPORTE MENSUAL (CON CIERRES)\nVendedor,${nombre}\nPeriodo,Del 1/${m}/${anio} al ${HOY}\nNeto,$${netoMes},Bruto,$${brutoMes},Comision,$${comMes}\nCierres incluidos,${cierresMes.length}\n\nRESUMEN POR PRODUCTO\nProducto,Cantidad,Total\n`; 
  Object.entries(resumen).forEach(([p, d]) => { csv += `"${p}",${d.c},${d.m}\n`; }); 
  csv += `\nDETALLE\nFecha,Hora,Producto,Base,Comision,Total,Metodo,Vendedor\n`; 
  todasVentasMes.forEach(v => csv += `${v.f},${v.h},"${v.p}",${v.vBase || v.v},${v.vComision || 0},${v.vFinal || v.v},${v.metodo || ''},${v.vendedor}\n`); 
  let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
  let aEl = document.createElement('a'); 
  aEl.href = URL.createObjectURL(blob); 
  aEl.download = `MES-COMPLETO-${m}-${anio}-${negocio}-NETO$${netoMes}-${HOY.replaceAll('/', '-')}.csv`; 
  aEl.click(); 
}

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
init();