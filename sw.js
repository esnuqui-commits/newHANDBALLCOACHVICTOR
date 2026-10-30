/* VICTOTALCOACH · service worker mínimo: hace la app instalable. NO guarda nada en caché
   (siempre se carga la versión actual) y no toca tus datos. */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',()=>{});
