const CACHE="her12-v2";
const CORE=["./","./index.html","./styles-v2.css","./program-v2.js","./runtime-v2.js","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response&&(response.ok||response.type==="opaque")){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{})}return response}).catch(()=>cached)))})
