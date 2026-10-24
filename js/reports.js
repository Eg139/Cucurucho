// ==========================================
// CUCURUCHO POS - MÓDULO DE REPORTES Y CIERRES
// ==========================================

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