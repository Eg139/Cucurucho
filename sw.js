const CACHE = 'cucurucho-v1.4'; // Subimos de versión

const FILES = [
  './',
  './index.html',
  './css/bienvenida.css',
  './css/variables-base.css',
  './css/pos-components.css',
  './js/config.js',
  './js/storage.js',
  './js/ui.js',
  './manifest.json',
  './nalusoft.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // 1. HTML, JS y CSS siempre a la red primero con política no-store para evitar retardos
  if (
    e.request.url.includes('index.html') || 
    e.request.url.includes('.css') || 
    e.request.url.includes('/js/')
  ) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' }).then(r => {
        if (r.status === 200) {
          const rClone = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, rClone));
        }
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // 2. Demás recursos estáticos (imágenes, fuentes, etc.)
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});