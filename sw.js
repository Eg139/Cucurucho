const CACHE = 'cucurucho-v9'; // <--- Subimos de versión para forzar la limpieza
const FILES = [
  './',
  './index.html',
  './style.css',
  './script.js',
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
  // 1. IGNORAR PETICIONES DE SUPABASE / API (NUNCA CACHEAR REST NI RPC)
  if (e.request.url.includes('supabase.co')) {
    return; // Pasa directo a la red sin intervenir
  }

  // 2. HTML, JS y CSS siempre a la red primero
  if (e.request.url.includes('script.js') || e.request.url.includes('index.html') || e.request.url.includes('style.css')) {
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
    // 3. Demás recursos estáticos (imágenes, fuentes)
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});