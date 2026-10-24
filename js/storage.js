// GESTIÓN DE DATOS Y PERSISTENCIA (Usa las variables globales de config.js)

// 1. Función guardar blindada para asegurar persistencia acumulativa
function guardar() { 
  localStorage.setItem('ventas_mes', JSON.stringify(ventas)); 
  if (typeof render === 'function') render(); 
}

function cargarProductos() { 
  let guardados = JSON.parse(localStorage.getItem('productos_config') || 'null'); 
  
  // Si ya configuró sus productos personalizados, respetamos esos y nada más
  if (guardados && guardados.length > 0) {
    productos = guardados;
  } else {
    // Si no hay nada guardado, usamos los default por compatibilidad inicial
    productos = typeof PRODUCTOS_DEFAULT !== 'undefined' ? PRODUCTOS_DEFAULT : []; 
  }
  
  if (typeof renderBotones === 'function') renderBotones(); 
}

// LÓGICA DE NEGOCIO Y MANIPULACIÓN DE DATOS
function getMesAnio(fechaStr) { 
  try { 
    let parts = fechaStr.split('/'); 
    return { m: parseInt(parts[1]), a: parseInt(parts[2]) }; 
  } catch (e) { 
    return { m: new Date().getMonth() + 1, a: new Date().getFullYear() }; 
  } 
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
  if (typeof renderCarrito === 'function') renderCarrito(); 
}

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
  if (typeof renderCarrito === 'function') renderCarrito(); 
}