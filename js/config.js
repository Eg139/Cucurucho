// CONFIGURACIÓN Y ESTADO GLOBAL DE CUCURUCHO
// Nota: PRODUCTOS_DEFAULT se mantiene únicamente como referencia inicial para la primera ejecución si se desea, 
// pero la app prioriza estrictamente lo que el usuario guardó en localStorage.
const PRODUCTOS_DEFAULT = [
  { id: "cuarto", nombre: "1/4 KG", precio: 4500 },
  { id: "medio", nombre: "1/2 KG", precio: 8000 },
  { id: "kilo", nombre: "1 KG", precio: 14500 },
  { id: "vaso", nombre: "Vaso", precio: 3000 },
  { id: "cucurucho", nombre: "Cucurucho", precio: 3500 },
  { id: "conodoble", nombre: "Cono doble", precio: 5000 }
];

// Carga segura: si no hay productos guardados, iniciamos con un array vacío [] 
// para forzar al usuario a crear su catálogo dinámico en el paso 3.
let productos = JSON.parse(localStorage.getItem('productos_config') || '[]');
let carrito = [];
let ventas = JSON.parse(localStorage.getItem('ventas_mes') || '[]');
const HOY = new Date().toLocaleDateString();
let COMISION_PY = Number(localStorage.getItem('comisionPY') || 35);

// Límite máximo de productos permitidos en Cucurucho (Versión gratuita / Lead Magnet)
const MAX_PRODUCTOS = 10;

/**
 * Valida y guarda los productos nuevos respetando el límite de 10 ítems.
 * @param {Array} nuevosProductos - Lista de productos ingresados por el usuario.
 */
function guardarProductosPersonalizados(nuevosProductos) {
  if (nuevosProductos.length > MAX_PRODUCTOS) {
    Swal.fire({
      icon: 'warning',
      title: 'Límite alcanzado',
      text: `Cucurucho POS permite hasta ${MAX_PRODUCTOS} productos en su versión gratuita. ¡Pasate a Super POS para inventarios ilimitados!`,
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#3D2314'
    });
    return false;
  }

  if (nuevosProductos.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Catálogo vacío',
      text: 'Debes configurar al menos un producto.',
      confirmButtonColor: '#3D2314'
    });
    return false;
  }

  productos = nuevosProductos;
  localStorage.setItem('productos_config', JSON.stringify(productos));
  return true;
}